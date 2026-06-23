package com.neuroguard.userservice.services;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.neuroguard.userservice.dto.UserDto;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class UserPdfService {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.DARK_GRAY);
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
    private static final Font CELL_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);
    private static final Color HEADER_BG = new Color(22, 119, 255);
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateUsersPdf(List<UserDto> users, String roleFilter) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4.rotate()); // landscape for more columns
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            Paragraph title = new Paragraph("NeuroGuard – User List Report", TITLE_FONT);
            title.setSpacingAfter(4);
            document.add(title);

            String subtitle = "Generated on " + LocalDateTime.now().format(DATE_FORMAT);
            if (roleFilter != null && !roleFilter.isBlank()) {
                subtitle += "  ·  Filter: " + roleFilter;
            }
            Paragraph sub = new Paragraph(subtitle, FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY));
            sub.setSpacingAfter(16);
            document.add(sub);

            // Table: ID, Username, Email, First Name, Last Name, Role
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{1f, 2.5f, 3f, 2.5f, 2.5f, 1.8f});
            table.setSpacingBefore(8);
            table.setSpacingAfter(8);

            // Header row
            String[] headers = {"ID", "Username", "Email", "First Name", "Last Name", "Role"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, HEADER_FONT));
                cell.setBackgroundColor(HEADER_BG);
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_LEFT);
                table.addCell(cell);
            }
            table.setHeaderRows(1);

            // Data rows
            for (UserDto u : users) {
                table.addCell(cell(String.valueOf(u.getId()), Element.ALIGN_RIGHT));
                table.addCell(cell(nullToEmpty(u.getUsername()), Element.ALIGN_LEFT));
                table.addCell(cell(nullToEmpty(u.getEmail()), Element.ALIGN_LEFT));
                table.addCell(cell(nullToEmpty(u.getFirstName()), Element.ALIGN_LEFT));
                table.addCell(cell(nullToEmpty(u.getLastName()), Element.ALIGN_LEFT));
                table.addCell(cell(nullToEmpty(u.getRole()), Element.ALIGN_LEFT));
            }

            document.add(table);

            // Footer line
            Paragraph footer = new Paragraph(
                "Total: " + users.size() + " user(s)",
                FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY)
            );
            footer.setSpacingBefore(12);
            document.add(footer);

        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        } finally {
            document.close();
        }
        return out.toByteArray();
    }

    private static PdfPCell cell(String text, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(nullToEmpty(text), CELL_FONT));
        cell.setPadding(5);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
