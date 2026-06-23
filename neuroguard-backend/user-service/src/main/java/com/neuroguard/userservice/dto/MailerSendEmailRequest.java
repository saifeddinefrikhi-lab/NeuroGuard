package com.neuroguard.userservice.dto;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;

public class MailerSendEmailRequest {
    private Recipient from;
    private List<Recipient> to;
    private String subject;
    private String text;
    private String html;

    public Recipient getFrom() { return from; }
    public void setFrom(Recipient from) { this.from = from; }

    public List<Recipient> getTo() { return to; }
    public void setTo(List<Recipient> to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getHtml() { return html; }
    public void setHtml(String html) { this.html = html; }

    public static class Recipient {
        private String email;
        private String name;

        public Recipient() {}

        public Recipient(String email, String name) {
            this.email = email;
            this.name = name;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
