require("isomorphic-fetch");

const { ConfidentialClientApplication } = require("@azure/msal-node");
const { Client } = require("@microsoft/microsoft-graph-client");
const env = require("../config/env");

const msalClient = new ConfidentialClientApplication({
  auth: {
    clientId: env.MS_CLIENT_ID,
    clientSecret: env.MS_CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${env.MS_TENANT_ID}`
  }
});

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function acquireAppAccessToken() {
  const tokenResponse = await msalClient.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"]
  });

  if (!tokenResponse?.accessToken) {
    throw new Error("Microsoft Graph did not return an app-only access token");
  }

  return tokenResponse.accessToken;
}

function buildMailPayload({ name, email, phone, subject, message }) {
  const enquirySubject = subject || "General Inquiry";
  const htmlBody = `
    <h2>New Hampshire Hotel Website Enquiry</h2>
    <table cellpadding="0" cellspacing="0" border="0">
      <tr><th align="left">Name</th><td>${escapeHtml(name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
      <tr><th align="left">Phone</th><td>${escapeHtml(phone || "Not provided")}</td></tr>
      <tr><th align="left">Subject</th><td>${escapeHtml(enquirySubject)}</td></tr>
    </table>
    <h3>Message</h3>
    <p>${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p>
  `;

  return {
    message: {
      subject: `New Website Enquiry: ${enquirySubject}`,
      toRecipients: [
        {
          emailAddress: {
            address: env.RECIPIENT_EMAIL
          }
        }
      ],
      replyTo: [
        {
          emailAddress: {
            address: email,
            name
          }
        }
      ],
      body: {
        contentType: "HTML",
        content: htmlBody
      }
    },
    saveToSentItems: true
  };
}

async function sendFormEmail(enquiry) {
  const accessToken = await acquireAppAccessToken();
  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken)
  });

  return graphClient
    .api(`/users/${encodeURIComponent(env.SENDER_EMAIL)}/sendMail`)
    .post(buildMailPayload(enquiry));
}

module.exports = { sendFormEmail };
