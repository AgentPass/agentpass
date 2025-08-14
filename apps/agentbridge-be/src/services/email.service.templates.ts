export const getAdminApprovalEmailTemplate = (adminEmail: string, verificationLink: string): string => {
  return `<!doctype html>
  <html lang="en">
    <body style="margin: 0; padding: 0; background-color: #171e29; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #f8f9fb;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #171e29; padding: 40px 0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1f2937; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);">
              <tr>
                <td style="padding: 32px 0; text-align: center; font-size: 18px">
                  A new admin has requested access:<br/>
                  <strong style="color: #2276fc">${adminEmail}</strong><br/><br/>
                  Click the button below to approve their access:
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-bottom: 32px">
                  <a href="${verificationLink}" style="background: #2276fc; color: #FFFFFF; display: inline-block; padding: 12px 32px; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold;">Approve Admin</a>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; font-size: 14px; color: #a7b0bd">
                  If you did not expect this request, you can safely ignore this message.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

export const getAdminApprovedEmailTemplate = (appLink: string): string => {
  return `<!doctype html>
  <html lang="en">
    <body style="margin: 0; padding: 0; background-color: #171e29; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #f8f9fb;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #171e29; padding: 40px 0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1f2937; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);">
              <tr>
                <td style="padding: 16px 0; text-align: center; font-size: 16px; color: #f8f9fb;">
                  Great news! Your account has been approved and you're now ready to start using AgentPass.<br/><br/>
                  Click the button below to access your dashboard and start exploring:
                </td>
              </tr>
              <tr>
                <td style="text-align: center;">
                  <a href="${appLink}" style="background: #2276fc; color: #FFFFFF; display: inline-block; padding: 12px 32px; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to AgentPass</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 0; text-align: center; font-size: 15px; color: #f8f9fb;">
                  We're excited to have you onboard!<br/>
                  <span style="color: #b0b7c3;">The AgentPass Team</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

export const getEasterEggWelcomeEmailTemplate = (appLink: string): string => {
  return `<!doctype html>
  <html lang="en">
    <body style="margin: 0; padding: 0; background-color: #171e29; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #f8f9fb;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #171e29; padding: 40px 0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1f2937; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);">
              <tr>
                <td style="text-align: center; font-size: 28px; font-weight: bold; padding-bottom: 10px">
                  <span style="color: #2276fc">🚀 AgentPass.ai</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 0; text-align: center; font-size: 18px">
                  <strong style="color: #2276fc;">Rocket launch detected!</strong><br/><br/>
                  Congratulations on discovering our easter egg! Your curiosity and exploration have earned you instant access to AgentPass.<br/><br/>
                  Your account has been activated and you're ready to start connecting AI agents to APIs:
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-bottom: 32px">
                  <a href="${appLink}" style="background: #2276fc; color: #FFFFFF; display: inline-block; padding: 12px 32px; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold;">🚀 Launch into AgentPass</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 0; text-align: center; font-size: 15px; color: #f8f9fb;">
                  Thanks for launching the rocket! We're excited to have curious explorers like you onboard.<br/>
                  <span style="color: #b0b7c3;">The AgentPass Team</span>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; font-size: 13px; color: #a7b0bd; padding-top: 16px;">
                  P.S. Keep exploring - there might be more surprises waiting! 🎯
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

export const getTenantInvitationEmailTemplate = (
  inviter: string,
  tenantName: string,
  role: string,
  invitationLink: string,
  expiresAt: Date,
): string => {
  return `<!doctype html>
  <html lang="en">
    <body style="margin: 0; padding: 0; background-color: #171e29; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; color: #f8f9fb;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #171e29; padding: 40px 0">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #1f2937; padding: 40px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);">
              <tr>
                <td style="text-align: center; font-size: 28px; font-weight: bold; padding-bottom: 10px">
                  <span style="color: #2276fc">AgentPass.ai</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 0; text-align: center; font-size: 18px">
                  <strong>${inviter}</strong> has invited you to join the tenant <strong>${tenantName}</strong> as a <strong>${role}</strong>.<br/><br/>
                  Click the button below to accept your invitation:
                </td>
              </tr>
              <tr>
                <td style="text-align: center; padding-bottom: 32px">
                  <a href="${invitationLink}" style="background: #2276fc; color: #FFFFFF; display: inline-block; padding: 12px 32px; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
                </td>
              </tr>
              <tr>
                <td style="text-align: center; font-size: 15px; color: #a7b0bd">
                  This invitation will expire on <strong>${expiresAt.toLocaleDateString()}</strong>.<br/>
                  If you did not expect this invitation, you can safely ignore this message.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};
