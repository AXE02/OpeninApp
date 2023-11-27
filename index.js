const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// API AND CLOUD DETAILS
const CLIENT_ID = '#';
const CLIENT_SECRET = '#';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '#'; //Improvement. Using env to store sensitive information. 

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

// Counter to track the number of times sendMail is called. Ensures mail is not sent multiple times.
let sendMailCount = 0;

// sendMail Function
async function sendMail() {
  try {
    if (sendMailCount > 0) { // Check if mail is already sent before
      console.log('Email already sent. Exiting...');
      return;
    }

    const accessToken = await oAuth2Client.getAccessToken();

    // Authorize account to send mail.
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: '#ME EMAIL ID',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    // Check for relevant emails
    const listMessagesResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'from: "#OTHER EMAIL ID" is:unread',
    });

    const unreadMessages = listMessagesResponse.data.messages;

    if (unreadMessages.length > 0) {
      // Select the first unread email from the sender
      const unreadEmail = unreadMessages[0];

      // Send a reply to the selected email
      const mailOptions = {
        from: '#My Name <#ME MAIL ID>',
        to: '#OTHER EMAIL ID',
        subject: `I am away!`,
        text: 'Hello. This mail is automated. I am away on vacation till January 2, 2024. Will get back to you then. Thanks and regards, Akshay',
      };

      // Sent and output shown in terminal
      const result = await transport.sendMail(mailOptions);
      console.log(`Reply sent to email from #ME MAIL ID`, result);

      // Add recieved mail to label.
      async function getLabelId(labelName) {
        const labelList = await gmail.users.labels.list({ userId: 'me' });
        const label = labelList.data.labels.find((label) => label.name === labelName);
        return label ? label.id : null;
      }
      const labelName = 'During Vacation';
      const labelId = await getLabelId(labelName);

      //Display error if label does not exis
      if (!labelId) {
        console.error(`Label "${labelName}" not found.`);
        return;
      }

      await gmail.users.messages.modify({
        userId: 'me',
        id: unreadEmail.id,
        resource: {
          addLabelIds: [labelId],
        },
      });
      console.log('A mail is added to', labelName);
      //Added to label

      // Increment the counter to indicate that the email has been sent
      sendMailCount++;
    } else { //Display no mails meet condition
      console.log('No relevant emails found');
    }
  } catch (error) {
    console.error(error.message); //Improvement. Error handling can be more specific. 
  }
}

// Schedule the email checking process at random intervals
setInterval(sendMail, Math.floor(Math.random() * (120 - 45) + 45) * 1000); //Improvement. Having a fix interval and triggers. 