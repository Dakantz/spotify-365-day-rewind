import { TestAccount as MailAccount, Transport } from "nodemailer";
import Mail, { Address, Attachment } from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import * as nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import SMTPPool from "nodemailer/lib/smtp-pool";
import MailMessage from "nodemailer/lib/mailer/mail-message";
import * as fs from "fs";
import * as path from "path";
import * as mustache from "mustache";
export interface Credentials {
  user: string;
  password: string;
}
export class Emailer {
  private transport: Mail;
  constructor(
    private credentials: SMTPConnection.Options,
    private defaultFrom: Address,
    public basePath = "../../email-templates"
  ) {
    this.transport = nodemailer.createTransport(credentials);
    this.transport.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email Server is ready to take our messages");
      }
    });
  }
  public async sendMail(
    name: string,
    email: string,
    subject: string,
    templatePath: string,
    data?: any,
    attachments: Attachment[] = []
  ) {
    let email_template = fs.readFileSync(
      path.join(__dirname, this.basePath, templatePath),
      { encoding: "utf8" }
    );
    let rendered = mustache.render(email_template, data);

    let message: Mail.Options = {
      to: {
        name,
        address: email,
      },
      from: this.defaultFrom,
      attachments,
      html: rendered,
      subject,
    };
    this.transport.sendMail(message);
  }
}
