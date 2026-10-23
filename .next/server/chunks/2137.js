"use strict";exports.id=2137,exports.ids=[2137],exports.modules={2137:(a,b,c)=>{c.d(b,{l:()=>g});var d=c(7230),e=c(64899),f=c(59811);async function g(a){let b,{applicationId:c,kind:g,to:h,subject:i,html:j,attachments:k,from:l=f.h0,replyTo:m=f.Zy,sentBy:n=null}=a,o="sent",p=null;try{let a=await (0,d.Qt)().emails.send({from:l,to:h,replyTo:m,subject:i,html:j,...k?.length?{attachments:k}:{}});a.error?(o="failed",p=a.error.message??"Resend returned an error"):b=a.data?.id}catch(a){o="failed",p=a instanceof Error?a.message:"Email send threw"}try{await (0,e.Zf)().from("internship_emails").insert({application_id:c,kind:g,to_email:h,subject:i,resend_id:b??null,status:o,error:p,sent_by:n})}catch(a){console.error("[internship email] ledger write failed:",a)}return"failed"===o&&console.error(`[internship email] ${g} to ${h} failed:`,p),{ok:"sent"===o,resendId:b,error:p??void 0}}},19655:(a,b,c)=>{c.d(b,{O:()=>f,T:()=>e});var d=c(57600);let e=`${d.W6}/emailogo.png`;function f(a={}){let{width:b=132,align:c="left"}=a,g=Math.round(b/2);return`<a href="${d.W6}" target="_blank" style="text-decoration:none;border:0;"><img src="${e}" width="${b}" height="${g}" alt="GrowQR" style="display:${"center"===c?"inline-block":"block"};border:0;outline:none;text-decoration:none;width:${b}px;height:${g}px;"></a>`}},59811:(a,b,c)=>{c.d(b,{DF:()=>t,HO:()=>w,Ko:()=>v,L2:()=>y,Zy:()=>n,h0:()=>m,mI:()=>u,wH:()=>x});var d=c(86642),e=c(68239),f=c(57600),g=c(19655);let h="-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif",i="#FF6A2F",j="#1A1A1A",k="#9CA3AF",l="#E5E7EB",m="GrowQR | Careers <hello@growqr.ai>",n="hello@growqr.ai";function o(a,b){return`
    <tr>
      <td style="padding:7px 0;font-family:${h};font-size:13px;color:${k};white-space:nowrap;">${(0,d.Z)(a)}</td>
      <td style="padding:7px 0;font-family:${h};font-size:13px;color:${j};font-weight:600;text-align:right;">${b}</td>
    </tr>`}function p(a){return a.trim()?`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#F9FAFB;border:1px solid ${l};border-radius:10px;margin:0 0 24px 0;">
      <tr><td style="padding:6px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${a}</table>
      </td></tr>
    </table>`:""}function q({heading:a,body:b,details:c="",cta:e,footnote:m}){return`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table{border-collapse:collapse;}td{font-family:sans-serif;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F3F4F6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F3F4F6;">
    <tr><td align="center" style="padding:32px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

        <tr><td style="padding:0 0 20px 4px;">
          <a href="${f.W6}" target="_blank" style="text-decoration:none;">
            <img src="${g.T}" width="132" height="66" alt="GrowQR"
                 style="display:block;border:0;outline:none;width:132px;height:66px;">
          </a>
        </td></tr>

        <tr><td style="background:#FFFFFF;border:1px solid ${l};border-radius:14px;padding:36px 32px;">

          <h1 style="margin:0 0 18px 0;font-family:${h};font-size:21px;line-height:1.3;font-weight:700;color:${j};">
            ${(0,d.Z)(a)}
          </h1>

          ${b}
          ${c}
          ${e?function(a,b){let c=(0,d.Z)(b);return`
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
      <tr><td>
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${c}" style="height:44px;v-text-anchor:middle;width:230px;" arcsize="18%"
          strokecolor="${i}" fillcolor="${i}">
          <w:anchorlock/><center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${(0,d.Z)(a)}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${c}" target="_blank"
           style="display:inline-block;background:${i};color:#ffffff !important;text-decoration:none;
                  font-family:${h};font-size:14px;font-weight:600;padding:13px 30px;border-radius:8px;line-height:1.2;">
          ${(0,d.Z)(a)}
        </a>
        <!--<![endif]-->
      </td></tr>
    </table>`}(e.label,e.href):""}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="border-top:1px solid ${l};padding-top:20px;">
              <p style="margin:0;font-family:${h};font-size:13px;line-height:1.6;color:${k};">
                ${m?`${m}<br>`:""}Team GrowQR
              </p>
            </td></tr>
          </table>

        </td></tr>

        <tr><td style="padding:20px 4px 0;">
          <p style="margin:0;font-family:${h};font-size:11px;line-height:1.6;color:${k};">
            Sent by GrowQR because you applied for an internship with us.
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`}function r(a){return`<p style="margin:0 0 16px 0;font-family:${h};font-size:15px;line-height:1.65;color:#4B5563;">${a}</p>`}function s(a){return`<strong style="color:${j};font-weight:600;">${(0,d.Z)(a)}</strong>`}function t(a,b,c,f){return{subject:"Your GrowQR interview is ready",html:q({heading:"You have been shortlisted",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, you are through to the first round for ${s(b)}.`)+r("This round is an AI interview you take in your own time. It takes about fifteen minutes and you need a quiet room and a working microphone."),details:p(o("Role",(0,d.Z)(b))+o("Format","AI interview, roughly 15 minutes")+(f?o("Complete by",(0,d.Z)(f)):"")),cta:{label:"Start interview",href:c},footnote:"Sign in with the email you applied with."})}}function u(a,b,c,f){return{subject:`Your GrowQR final round: ${b}`,html:q({heading:"Final round scheduled",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, your interview went well enough to move forward.`)+r("This last round is a conversation with the team. Come with questions."),details:p(o("When",(0,d.Z)(b))+(c?o("With",(0,d.Z)(c)):"")+o("Format","Video call, 30 minutes")),cta:f?{label:"Join the call",href:f}:void 0,footnote:"Reply to this email if the time does not work."})}}function v(a,b,c,f){return{subject:`Your GrowQR internship offer: ${b}`,html:q({heading:"We would like you to join us",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, we are offering you the ${s(b)} internship at GrowQR.`)+r("Your formal offer letter follows separately. Reply to this email to accept, or with any questions first."),details:p(o("Role",(0,d.Z)(b))+(f?o("Duration",(0,d.Z)(f)):"")+(c?o("Starts",(0,d.Z)(c)):""))})}}function w(a,b){return{subject:`Your GrowQR internship appointment letter: ${b}`,html:q({heading:"Your appointment letter",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, your appointment letter for the ${s(b)} internship is attached.`)+r("Please read it, sign it, and reply to this email with a signed copy to confirm."),footnote:"The letter is a PDF attached to this email."})}}function x(a,b){return{subject:"Update on your GrowQR internship application",html:q({heading:"You have been selected",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, you have been selected for the ${s(b)} internship.`)+r("We are putting your offer together and will send it in the next few days.")})}}function y(a,b){return{subject:"Update on your GrowQR internship application",html:q({heading:"We are not moving forward",body:r(`Hi ${(0,d.Z)((0,e.u)(a))}, we are not taking your application for ${s(b)} further.`)+r("You are welcome to apply again for a future cohort. Your GrowQR profile stays yours either way, and building it up is the best thing you can do before the next application."),cta:{label:"Open your profile",href:"https://app.growqr.ai"}})}}},68239:(a,b,c)=>{c.d(b,{u:()=>e});let d=new Set(["dr","mr","mrs","ms","miss","mx","prof","professor","ca","cs","cma","adv","advocate","er","sir","madam","shri","smt"]);function e(a,b="there"){if(!a)return b;for(let b of a.trim().split(/\s+/)){let a=b.replace(/[().,'"]/g,"");if(a&&!d.has(a.toLowerCase()))return b.replace(/^[("']+|[).,"']+$/g,"")}return b}}};