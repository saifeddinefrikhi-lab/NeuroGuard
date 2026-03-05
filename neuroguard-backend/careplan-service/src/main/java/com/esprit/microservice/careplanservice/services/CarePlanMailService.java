package com.esprit.microservice.careplanservice.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends emails when a care plan is created (doctor → patient).
 * Only sends if neuroguard.mail.enabled=true and patient has an email.
 */
@Slf4j
@Service
public class CarePlanMailService {

    private final JavaMailSender mailSender;

    public CarePlanMailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${neuroguard.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${neuroguard.mail.from:neuroguard@localhost}")
    private String fromAddress;

    /**
     * Called at startup (profile local): logs mail status and sends a test email to "from" address
     * so you can verify SMTP. Check the console and your inbox (neuroguard584@gmail.com).
     */
    public void logStatusAndSendTestIfEnabled() {
        log.info("[MAIL] -------- Mail config --------");
        log.info("[MAIL] neuroguard.mail.enabled = {}", mailEnabled);
        log.info("[MAIL] neuroguard.mail.from = {}", fromAddress);
        log.info("[MAIL] JavaMailSender available = {}", mailSender != null);
        if (!mailEnabled || mailSender == null) {
            log.warn("[MAIL] Email will NOT be sent. Fix config and use profile 'local'.");
            return;
        }
        log.info("[MAIL] Sending test email to {} ...", fromAddress);
        try {
            sendHtmlEmail(fromAddress, "NeuroGuard – Test envoi mail", "<p>Si vous recevez ceci, l'envoi SMTP fonctionne.</p>");
            log.info("[MAIL] Test email SENT. Check inbox (and spam) for {}", fromAddress);
        } catch (Exception e) {
            log.error("[MAIL] Test email FAILED. Fix SMTP (Gmail app password, etc.): {}", e.getMessage(), e);
        }
    }

    /**
     * Sends a notification email to the patient when a care plan has been created.
     * Runs asynchronously so it does not block the API response.
     */
    @Async
    public void sendCarePlanCreatedToPatient(
            String patientEmail,
            String patientFirstName,
            String providerFullName,
            Long carePlanId,
            String priority
    ) {
        if (!mailEnabled) {
            log.info("[MAIL] Mail disabled (neuroguard.mail.enabled=false). Set MAIL_ENABLED=true or use profile 'local'. Skipping.");
            return;
        }
        if (patientEmail == null || patientEmail.isBlank()) {
            log.info("[MAIL] Patient has no email in database. Skipping care plan notification.");
            return;
        }
        if (mailSender == null) {
            log.warn("[MAIL] JavaMailSender not available (SMTP not configured). Skipping.");
            return;
        }
        log.info("[MAIL] Sending care plan #{} notification to {}", carePlanId, patientEmail);
        try {
            String subject = "NeuroGuard – Nouveau plan de soins créé pour vous";
            String patientName = (patientFirstName != null && !patientFirstName.isBlank())
                    ? patientFirstName : "Patient";
            String body = buildCarePlanCreatedBody(patientName, providerFullName, carePlanId, priority);
            sendHtmlEmail(patientEmail, subject, body);
            log.info("[MAIL] Email sent successfully to {}", patientEmail);
        } catch (Exception e) {
            log.error("[MAIL] Failed to send email to {}: {}", patientEmail, e.getMessage(), e);
        }
    }

    private static String priorityLabel(String priority) {
        if (priority == null || priority.isBlank()) return "Moyenne";
        return switch (priority.toUpperCase()) {
            case "HIGH" -> "Haute";
            case "LOW" -> "Basse";
            default -> "Moyenne";
        };
    }

    private String buildCarePlanCreatedBody(String patientName, String providerFullName, Long carePlanId, String priority) {
        String p = (providerFullName != null && !providerFullName.isBlank()) ? providerFullName : "votre médecin";
        String pri = priorityLabel(priority);
        return """
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #1677ff;">NeuroGuard – Plan de soins</h2>
              <p>Bonjour %s,</p>
              <p><strong>%s</strong> vous a créé un nouveau plan de soins.</p>
              <ul>
                <li>Référence du plan : <strong>#%d</strong></li>
                <li>Priorité : <strong>%s</strong></li>
              </ul>
              <p>Connectez-vous à NeuroGuard pour consulter le détail du plan (nutrition, sommeil, activité, médication) et suivre votre progression.</p>
              <p>Cordialement,<br/>L'équipe NeuroGuard</p>
            </div>
            """.formatted(patientName, p, carePlanId, pri);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException {
        if (mailSender == null) return;
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }
}
