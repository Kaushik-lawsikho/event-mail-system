const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const logger = require("./logger");
const cfg = require("./config");

const transport = nodemailer.createTransport(cfg.smtp);

function compileTemplate(name, data) {
  const tplPath = path.join(__dirname, "templates", `${name}.hbs`);
  const source = fs.readFileSync(tplPath, "utf8");
  const template = Handlebars.compile(source);
  return template(data);
}

async function sendMail({ to, subject, templateName, templateData, from = "no-reply@example.com" }) {
  const html = compileTemplate(templateName, templateData);
  const info = await transport.sendMail({ from, to, subject, html });
  logger.info({ messageId: info.messageId, to }, "Email sent");
  return info;
}

module.exports = { sendMail };
