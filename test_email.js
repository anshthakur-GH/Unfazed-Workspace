require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    try {
        console.log('Attempting to send test email...');
        console.log(`From: ${process.env.EMAIL_USER}`);
        // console.log(`To: mailtoanshthakur@gmail.com`); // Hardcoded test

        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'mailtoanshthakur@gmail.com',
            subject: 'Test Email from Unfazed Workspace',
            text: 'If you receive this, the email credentials are working correctly.'
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

testEmail();
