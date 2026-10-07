/**
 * "Skills That Travel" — GrowQR x British Council EnglishScore event invite.
 *
 * Matches the house Zoho template (crm-docs/campaign/mail-1.html) exactly:
 * flat table layout, every color/font inline, no CSS classes, no dark-mode
 * media query. Zoho's editor rewrites HTML on save and drops anything that
 * isn't inline, so this deliberately does not reuse lib/email/shell.ts.
 *
 * Placeholders: {{greeting_name}}, {{poster_url}}, {{rsvp_url}}.
 * Letter copy is verbatim from the brief, only the salutation is personalised.
 * No custom unsubscribe link: Zoho auto-injects its own compliant footer
 * (Unsubscribe / Manage Preference / Update Profile) below custom HTML
 * content, and our own $[UNSUBSCRIBE]$ text was never actually resolved by
 * Zoho — a hand-rolled one here would just be a second, dead link.
 */
export const SKILLS_THAT_TRAVEL_HTML = `<html><head>
<meta charset="UTF-8"/>
<meta content="width=device-width" name="viewport"/>
<style>body { margin: 0; padding: 0; background-color: rgb(247, 247, 248) }@media only screen and (max-width: 620px) {.container { width: 100% !important; max-width: 100% !important } .outer-pad { padding: 22px 14px !important } .card-pad { padding: 36px 28px !important } .head { font-size: 21px !important } }</style>
</head><body><div style="word-wrap: break-word; word-break: break-word; font-family: Verdana, arial, Helvetica, sans-serif; font-size: 13px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f7f8" style="background-color: rgb(247, 247, 248); margin: 0; padding: 0; width: 100%">
<tbody><tr><td align="center" class="outer-pad" bgcolor="#f7f7f8" style="background-color: rgb(247, 247, 248); padding: 56px 16px">

<table class="container" width="560" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 560px; max-width: 560px; border-collapse: collapse">
<tbody><tr><td class="card-pad" bgcolor="#ffffff" style="background-color: rgb(255, 255, 255); padding: 56px 56px 48px 56px; border: 1px solid rgb(237, 237, 240); border-radius: 8px">

<p style="margin: 0 0 24px 0"><img src="https://www.growqr.ai/emailogo.png" alt=" GrowQR" height="70" width="140" style="display: block; border: 0; outline: none; text-decoration: none"/></p>
<p style="margin: 0 0 4px 0; color: rgb(255, 107, 53); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">GrowQR &amp; British Council EnglishScore</p>
<p class="head" style="margin: 0 0 20px 0; color: rgb(15, 17, 21); font-size: 22px; font-weight: 600; line-height: 1.3; letter-spacing: -0.3px; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Skills That Travel: English, Digital Readiness &amp; Global Career Opportunities</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Dear {{greeting_name}},</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">What makes a skill truly valuable today? Perhaps it is not merely what we know, but how confidently that knowledge can travel, across classrooms, technologies, professions and borders.</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">GrowQR, in association with British Council EnglishScore, is pleased to invite academicians, university and school faculty, students, academic leaders, and education professionals to an interactive dialogue:</p>

<p style="margin: 0 0 14px 0; color: rgb(15, 17, 21); font-size: 15px; font-weight: 600; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">SKILLS THAT TRAVEL: English, Digital Readiness &amp; Global Career Opportunities<br/><span style="font-weight: 400">An Interactive Dialogue by GrowQR &amp; British Council EnglishScore</span></p>

<p style="margin: 0 0 8px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">The session will feature:</p>

<p style="margin: 0 0 10px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif"><strong style="color: rgb(15, 17, 21)">Pranav Prashar</strong><br/>Founder &amp; President | GrowQR<br/><em>Ventures for the AI Era</em><br/>Formerly associated with Citi Group, Morgan Stanley, Arm &amp; Hammer and UNICEF</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif"><strong style="color: rgb(15, 17, 21)">Bartosz Prokop</strong><br/>Head of Strategic Partnerships &amp; Business Development, British Council EnglishScore</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">The conversation will explore the increasingly important intersection of English proficiency, digital readiness and global career opportunities. As education moves beyond geographical and disciplinary boundaries, the ability to communicate effectively and navigate digital environments is becoming central not only to employability, but also to teaching, learning and professional mobility.</p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">For students, it is an opportunity to think beyond qualifications towards global readiness. For faculty and school teachers, it offers a space to reflect on how communication and digital capabilities are reshaping learner outcomes. For academicians and academic leaders, the session opens a wider conversation around preparing institutions and learners for a world where skills must increasingly be visible, transferable and globally relevant.</p>

<p style="margin: 0 0 4px 0; color: rgb(15, 17, 21); font-size: 15px; font-weight: 600; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Date: Monday, 14 September 2026<br/>Time: 4:00 PM &ndash; 5:00 PM<br/>Venue: GrowQR Office, 4th Floor, WeSource Building, Plot No. 8, Sector 125, Noida, Uttar Pradesh &ndash; 201313</p>

<p style="margin: 14px 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">The session will be followed by High Tea and informal interaction, because some of the most interesting academic conversations begin after the formal presentation ends. We would be delighted to welcome you and also encourage you to share this invitation with students, colleagues and faculty members who may benefit from the dialogue.</p>

<p style="margin: 0 0 20px 0"><img src="{{poster_url}}" alt="Skills That Travel poster with RSVP QR code" width="448" style="display: block; width: 100%; max-width: 448px; border: 1px solid rgb(237, 237, 240); border-radius: 8px"/></p>

<p style="margin: 0 0 14px 0; color: rgb(91, 100, 114); font-size: 15px; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Prior registration is requested. Please scan the QR code on the attached poster to RSVP.</p>

<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 12px 0 24px 0">
<tbody><tr><td bgcolor="#ff6b35" style="background-color: rgb(255, 107, 53); border-radius: 5px">
<a href="{{rsvp_url}}" style="background-color: rgb(255, 107, 53); color: rgb(255, 255, 255); display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; line-height: 1; text-decoration: none; border-radius: 5px">RSVP for the session</a>
</td></tr></tbody></table>

<p style="margin: 0 0 4px 0; color: rgb(15, 17, 21); font-size: 15px; font-style: italic; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Come with questions. Leave with perspectives that travel.</p>
<p style="margin: 0 0 14px 0; color: rgb(15, 17, 21); font-size: 15px; font-weight: 600; line-height: 1.8; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Learn. Connect. Become Globally Ready.</p>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin: 36px 0 0 0">
<tbody><tr><td height="1" bgcolor="#ededf0" style="background-color: rgb(237, 237, 240); height: 1px; line-height: 1px; font-size: 0">&nbsp;</td></tr></tbody></table>
<p style="margin: 18px 0 0 0; color: rgb(154, 160, 170); font-size: 13px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">Warm regards,<br/>Team GrowQR | Agentic AI<br/><span style="color: rgb(255, 107, 53)">One QR. One Identity. Unlock Growth.</span></p>

</td></tr></tbody></table>

<table class="container" width="560" cellpadding="0" cellspacing="0" border="0" align="center" style="width: 560px; max-width: 560px; border-collapse: collapse">
<tbody><tr><td align="center" bgcolor="#f7f7f8" style="background-color: rgb(247, 247, 248); padding: 20px 16px 0 16px">
<p style="margin: 0; color: rgb(168, 174, 184); font-size: 11px; line-height: 1.7; font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif">You're receiving this because of your association with GrowQR.</p>
</td></tr></tbody></table>

</td></tr></tbody></table>
</div></body></html>`;
