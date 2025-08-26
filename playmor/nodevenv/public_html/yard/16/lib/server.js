const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the yard directory
app.use(express.static(path.join(__dirname, '../../../../../public_html/yard')));

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../../../../public_html/yard/index.html'));
});

// API routes can be added here
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Yard Designer API is running' });
});

// Email sending endpoint
app.post('/send_email.php', async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            phone_number,
            zip_code,
            notes,
            design_image,
            parts_pdf,
            part_list
        } = req.body;

        // Zeptomail configuration
        const zeptomailToken = 'Zoho-enczapikey wSsVR60lrhX2W6Z7mDT5c+pumw4EAAyiHRwojlOpuHb/Ha2W/cdokUDLAgKkG6AeQ2RvETdAp+l4zhsDgTtdi9okzAtRDCiF9mqRe1U4J3x17qnvhDzJXmtclRuKK40AwgRrmWhgGs0n+g==';
        const salesEmail = 'info@playmorswingsets.com';

        // Generate HTML email content
        const htmlContent = `
        <html>
        <body style="font-family: Arial, sans-serif; margin: 40px; color: #333;">
          <h2 style="color: #4CAF50;">New Quote Request - Yard Designer</h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${first_name} ${last_name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone_number}</p>
            <p><strong>Zip Code:</strong> ${zip_code}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          
          <div style="margin: 20px 0;">
            <h3>Design Preview</h3>
            <img src="${design_image}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px;" alt="Playground Design" />
          </div>
          
          <div style="background: #f0f8f0; padding: 20px; border-radius: 8px;">
            <h3>Parts List</h3>
            ${generatePartsListHTML(part_list)}
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This quote was generated automatically from the Yard Designer tool at playmorswingsets.com
          </p>
        </body>
        </html>`;

        // Generate text version
        let textContent = `Quote Request from ${first_name} ${last_name}\n\n`;
        textContent += `Contact Info:\n`;
        textContent += `Email: ${email}\n`;
        textContent += `Phone: ${phone_number}\n`;
        textContent += `Zip Code: ${zip_code}\n\n`;

        if (notes) {
            textContent += `Notes: ${notes}\n\n`;
        }

        textContent += `Parts List:\n`;
        part_list.forEach(part => {
            textContent += `• ${part.name}\n`;
            if (part.options && part.options.length > 0) {
                part.options.forEach(option => {
                    textContent += `  - ${option}\n`;
                });
            }
            textContent += `\n`;
        });

        // Prepare email payload
        const emailPayload = {
            from: { address: 'noreply@playmorswingsets.com' },
            to: [{
                email_address: {
                    address: salesEmail,
                    name: 'Sales Team'
                }
            }],
            cc: [{
                email_address: {
                    address: email,
                    name: `${first_name} ${last_name}`
                }
            }],
            reply_to: {
                address: email,
                name: `${first_name} ${last_name}`
            },
            subject: `Quote Request from ${first_name} ${last_name} - Yard Designer`,
            htmlbody: htmlContent,
            textbody: textContent
        };

        // Add PDF attachment if provided
        if (parts_pdf) {
            emailPayload.attachments = [{
                content: parts_pdf,
                mime_type: 'application/pdf',
                name: `quote-${first_name}-${last_name}-${Date.now()}.pdf`
            }];
        }

        // Send email via Zeptomail
        console.log('Sending email to:', salesEmail);
        console.log('Email payload:', JSON.stringify(emailPayload, null, 2));
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://api.zeptomail.com/v1.1/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'authorization': zeptomailToken,
                'cache-control': 'no-cache',
                'content-type': 'application/json',
            },
            body: JSON.stringify(emailPayload)
        });

        console.log('Zeptomail response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.log('Zeptomail error:', errorData);
            throw new Error(`Zeptomail API Error: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('Email sent successfully. Zeptomail response:', result);
        
        res.json({ success: true, message: 'Email sent successfully' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: error.message });
    }
});

function generatePartsListHTML(partList) {
    let html = '<ul style="margin: 10px 0; padding-left: 20px;">';
    partList.forEach(part => {
        html += `<li style="margin: 8px 0; font-weight: bold;">${part.name}`;
        if (part.options && part.options.length > 0) {
            html += '<ul style="margin: 5px 0; padding-left: 20px; font-weight: normal;">';
            part.options.forEach(option => {
                html += `<li style="margin: 3px 0; color: #666;">${option}</li>`;
            });
            html += '</ul>';
        }
        html += '</li>';
    });
    html += '</ul>';
    return html;
}

// Start server
app.listen(PORT, () => {
    console.log(`Yard Designer server running on http://localhost:${PORT}`);
});