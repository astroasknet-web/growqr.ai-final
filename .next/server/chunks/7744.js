"use strict";exports.id=7744,exports.ids=[7744],exports.modules={17425:(a,b,c)=>{c.d(b,{Xn:()=>B,DN:()=>y});var d=c(36927),e=c(7230),f=c(5744),g=c(86642),h=c(22191),i=c(50303),j=c(81253),k=c(19655),l=c(68239);let m="-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif",n={booked:{subject:a=>`Your GrowQR call is confirmed — ${a}`,heading:"Your call is confirmed",intro:"we're looking forward to speaking with you."},rescheduled:{subject:a=>`Your GrowQR call has moved — ${a}`,heading:"Your call has been rescheduled",intro:"your call has a new time. Everything else stays the same."},cancelled:{subject:()=>"Your GrowQR call has been cancelled",heading:"Your call has been cancelled",intro:"your call is cancelled. If that wasn't intentional, you can book again any time."}};function o(a,b,c){try{return a.toLocaleString("en-IN",{...c,timeZone:b})}catch{return null}}let p="Asia/Kolkata",q=a=>!a||"Asia/Kolkata"===a||"Asia/Calcutta"===a,r=(a,b,c=!1)=>`<tr><td style="padding:13px 18px;${c?"":"border-bottom:1px solid #eef0f2;"}">
     <p style="margin:0 0 2px;font-family:${m};font-size:11px;color:#8b919a;line-height:1;">${a}</p>
     <p style="margin:0;font-family:${m};font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;word-break:break-word;">${b}</p>
   </td></tr>`,s=(0,h.h)("cal-notify"),t="GrowQR | Calls <hello@growqr.ai>",u=["sahil@growqr.ai","support@growqr.ai"],v=["pranav@growqr.ai"],w={booked:{verb:"booked",heading:"New call booked"},rescheduled:{verb:"rescheduled",heading:"Call rescheduled"},cancelled:{verb:"cancelled",heading:"Call cancelled"}};function x(a,b,c){if(!b)return"";let d=c?.raw?b:(0,g.Z)(b);return`<p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">${(0,g.Z)(a)}:</strong> ${d}</p>`}async function y(a){let b=(0,d.Zf)(),{data:c,error:e}=await b.from("call_bookings").select("*").eq("id",a).maybeSingle();if(e||!c)return void s.error(`booking ${a} not found for notification:`,e);await z(c),await A(c)}async function z(a){if(a.notifications_count>=a.events_count)return;let b=(0,d.Zf)(),{subject:c,html:h}=function(a){let b=w[a.status]??w.booked,c=(0,j.pv)(a.cal_event_type_id);return{subject:`[GrowQR] Call ${b.verb} — ${a.attendee_name}${a.company?` (${a.company})`:""}`,html:(0,f.P)(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR Calls</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">${(0,g.Z)(b.heading)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            ${x("When",function(a,b){if(!a)return"—";let c=new Date(a);if(Number.isNaN(c.getTime()))return"—";let d=c.toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short",timeZone:"Asia/Kolkata"});if(!b||"Asia/Kolkata"===b)return`${d} IST`;try{let a=c.toLocaleString("en-IN",{dateStyle:"full",timeStyle:"short",timeZone:b});return`${d} IST &nbsp;\xb7&nbsp; ${a} (${b})`}catch{return`${d} IST`}}(a.start_time,a.attendee_timezone),{raw:!0})}
                            ${x("Type",c)}
                            <div class="divider" style="height: 1px; margin: 10px 0 14px 0;"></div>
                            ${x("Name",a.attendee_name)}
                            ${x("Email",`<a href="mailto:${(0,g.Z)(a.email)}" style="color: #ff6b35; text-decoration: none;">${(0,g.Z)(a.email)}</a>`,{raw:!0})}
                            ${x("Company",a.company)}
                            ${x("Team size",a.team_size)}
                            ${x("Country",(0,i.sM)(a.country_code))}
                            <div class="divider" style="height: 1px; margin: 10px 0 14px 0;"></div>
                            ${x("Booked from",a.source)}
                            ${x("Page",a.page_path)}
                            ${x("Campaign",a.utm_campaign)}
                            ${x("Source / medium",a.utm_source?`${a.utm_source} / ${a.utm_medium??"—"}`:null)}
                            ${a.is_disposable_email?x("⚠ Note","Disposable email address — not synced to CRM"):""}
                            ${x("Cancellation reason",a.cancellation_reason)}
                          </td>
                        </tr>
                      </table>

                      ${a.meeting_url&&"cancelled"!==a.status?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                               <tr><td align="left">
                                 <a class="cta" href="${(0,g.Z)(a.meeting_url)}">Join the meeting</a>
                               </td></tr>
                             </table>`:""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 12px 8px 0 8px;">
                <p class="text-muted" style="margin: 0; font-size: 12px;">Booked through Cal.com. The attendee has already received their own confirmation and calendar invite.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)}}(a);await (0,e.Qt)().emails.send({from:t,to:u,cc:(0,j.$u)(a.source)?void 0:v,replyTo:a.email,subject:c,html:h});let{error:k}=await b.from("call_bookings").update({notifications_count:a.events_count}).eq("id",a.id);k&&s.error(`booking ${a.id} notification counter write failed:`,k),s.info(`booking ${a.id} team-notified (${a.status})`)}async function A(a){if(a.attendee_notifications_count>=a.events_count)return;let b=(0,d.Zf)();if(a.is_disposable_email){await b.from("call_bookings").update({attendee_notifications_count:a.events_count}).eq("id",a.id),s.info(`booking ${a.id} attendee confirmation skipped (disposable address)`);return}try{let{subject:c,html:d}=function(a){let b=a.status in n?a.status:"booked",c=n[b],d="cancelled"===b,e=(0,j.pv)(a.cal_event_type_id),f=function(a,b){let c=new Date(a);if(Number.isNaN(c.getTime()))return"—";let d={dateStyle:"full",timeStyle:"short"},e=o(c,p,d);if(q(b))return e?`${e} IST`:c.toISOString();let f=o(c,b,d);return f?`${f} (${b}) \xb7 ${e} IST`:e?`${e} IST`:c.toISOString()}(a.start_time,a.attendee_timezone),h=(0,g.Z)((0,l.u)(a.attendee_name)),i=function(a,b){let c=new Date(a);if(Number.isNaN(c.getTime()))return"—";let d={dateStyle:"medium",timeStyle:"short"};return o(c,q(b)?p:b,d)??o(c,p,d)??c.toISOString()}(a.start_time,a.attendee_timezone),s=`${j.kc}/booking/${a.cal_uid}`,t=(d?["Nothing further is needed from you","Book again whenever the timing suits you"]:["You'll receive a calendar invite with the meeting link","We'll review your details before the call so we can be useful from minute one","Need to change the time? Use the link below"]).map(a=>`<tr><td style="padding:2px 0;font-family:${m};font-size:13px;color:#374151;line-height:1.6;">
           <span style="color:#FF6A2F;">&#8226;</span>&ensp;${(0,g.Z)(a)}
         </td></tr>`).join(""),u=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>${(0,g.Z)(c.heading)}</title>
  <style>
    @media (prefers-color-scheme:dark){
      .email-bg{background-color:#f4f5f7 !important;}
      .card{background-color:#ffffff !important;border-color:#e5e7eb !important;}
      .card-inner{background-color:#f7f8f9 !important;}
      .text-dark{color:#1a1a2e !important;}
      .text-mid{color:#6b7280 !important;}
      .text-light{color:#9ca3af !important;}
      .accent-line{background-color:#FF6A2F !important;}
    }
    @media only screen and (max-width:600px){
      .card{border-radius:8px !important;}
      .px{padding-left:24px !important;padding-right:24px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">

<div style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${(0,g.Z)(d?"Your GrowQR call has been cancelled.":`Your ${e} is set for ${i}.`)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f4f5f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="card" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

      <tr>
        <td class="px" style="background-color:#ffffff;padding:24px 36px 16px;">
          ${(0,k.O)({width:120})}
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:0 36px;">
          <div class="accent-line" style="height:2px;background-color:#FF6A2F;border-radius:1px;"></div>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <h1 class="text-dark" style="margin:0 0 4px;font-family:${m};font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:-0.2px;">
            ${(0,g.Z)(c.heading)}
          </h1>
          <p class="text-mid" style="margin:0;font-family:${m};font-size:13.5px;color:#6b7280;line-height:1.5;">
            Hi ${h}, ${(0,g.Z)(c.intro)}
          </p>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:20px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-inner" style="background-color:#f7f8f9;border-radius:8px;overflow:hidden;">
            ${r(d?"Was scheduled for":"When",(0,g.Z)(f))}
            ${r("What",(0,g.Z)(e),!a.meeting_url||d)}
            ${a.meeting_url&&!d?r("Where",`<a href="${(0,g.Z)(a.meeting_url)}" style="color:#FF6A2F;text-decoration:none;">Join the meeting</a>`,!0):""}
          </table>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <div style="height:1px;background-color:#eef0f2;"></div>
        </td>
      </tr>

      <tr>
        <td class="px" style="padding:18px 36px 0;">
          <p class="text-light" style="margin:0 0 8px;font-family:${m};font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;">
            ${d?"What happens next":"Before the call"}
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">${t}</table>
        </td>
      </tr>

      ${d?"":`<tr>
               <td class="px" style="padding:20px 36px 0;">
                 <a href="${(0,g.Z)(s)}" style="display:inline-block;font-family:${m};font-size:13px;font-weight:600;color:#FF6A2F;text-decoration:none;">
                   Reschedule or cancel &rarr;
                 </a>
               </td>
             </tr>`}

      <tr>
        <td class="px" style="padding:24px 36px 22px;">
          <div style="height:1px;background-color:#eef0f2;margin-bottom:16px;"></div>
          <p class="text-light" style="margin:0;font-family:${m};font-size:11.5px;color:#9ca3af;line-height:1.6;">
            Questions? Reply to this email or contact
            <a href="mailto:support@growqr.ai" style="color:#FF6A2F;text-decoration:none;">support@growqr.ai</a>
          </p>
          <p style="margin:4px 0 0;font-family:${m};font-size:10.5px;color:#c9cdd4;line-height:1;">
            GrowQR
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`;return{subject:c.subject(i),html:u}}(a);await (0,e.Qt)().emails.send({from:t,to:a.email,replyTo:"support@growqr.ai",subject:c,html:d});let{error:f}=await b.from("call_bookings").update({attendee_notifications_count:a.events_count}).eq("id",a.id);f&&s.error(`booking ${a.id} attendee counter write failed:`,f),s.info(`booking ${a.id} attendee-confirmed (${a.status})`)}catch(b){s.error(`booking ${a.id} attendee confirmation failed:`,b)}}async function B(){let a=(0,d.Zf)(),b=new Date(Date.now()-3e5).toISOString(),{data:c,error:e}=await a.from("call_bookings").select("id").or("notifications_pending.eq.true,attendee_notifications_pending.eq.true").lt("updated_at",b).order("created_at",{ascending:!0}).limit(25);if(e)return s.error("notification retry query failed:",e),0;let f=0;for(let{id:a}of c??[])try{await y(a),f+=1}catch(b){s.error(`booking ${a} notification retry failed:`,b)}return f&&s.info(`retried ${f} pending booking notification(s)`),f}},57600:(a,b,c)=>{c.d(b,{Hh:()=>h,Jm:()=>l,W3:()=>g,W6:()=>d,Xt:()=>m,gW:()=>k,rf:()=>f});let d="https://www.growqr.ai",e=`${d}/#organization`;function f(a){return`${d}${a.startsWith("/")?a:`/${a}`}`}function g(a){return f(a)}let h={url:"/og-image.png",width:1200,height:630,alt:"GrowQR — One QR. One Identity. Unlocks Growth."},i={"Asia/Kolkata":"+05:30",UTC:"+00:00"};function j(a,b,c){let d=function(a){if(!a)return null;let b=a.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);if(!b)return null;let c=parseInt(b[1],10),d=b[2],e=b[3]?.toUpperCase();return("PM"===e&&c<12&&(c+=12),"AM"===e&&12===c&&(c=0),c>23)?null:`${String(c).padStart(2,"0")}:${d}:00`}(b)??"00:00:00",e=c?i[c]:void 0;return`${a}T${d}${e??""}`}function k(a){let b=f(`/events/${a.slug}`),c="online"===a.event_mode,d=c?{"@type":"VirtualLocation",url:a.meeting_url??b}:{"@type":"Place",name:a.venue??a.title,address:{"@type":"PostalAddress",...a.city?{addressLocality:a.city}:{},...a.country?{addressCountry:a.country}:{}}},g=a.poster_url??a.speaker_image??f("/logo.png");return{"@context":"https://schema.org","@type":"Event",name:a.title,...a.short_description?{description:a.short_description}:{},startDate:j(a.event_date,a.start_time,a.timezone),...a.end_time?{endDate:j(a.event_date,a.end_time,a.timezone)}:{},eventAttendanceMode:c?"https://schema.org/OnlineEventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",eventStatus:"https://schema.org/EventScheduled",location:d,image:g,url:b,organizer:{"@id":e},...a.speaker_name?{performer:{"@type":"Person",name:a.speaker_name}}:{}}}function l(a){let b=f(`/experts/${a.slug}`),c=a.reviewCount>0&&a.reviews.length>0;return{"@context":"https://schema.org","@type":"Person",name:a.name,jobTitle:a.role,description:a.bio,image:a.image,url:b,...c?{aggregateRating:{"@type":"AggregateRating",ratingValue:a.rating,reviewCount:a.reviewCount},review:a.reviews.map(a=>({"@type":"Review",author:{"@type":"Person",name:a.name},reviewRating:{"@type":"Rating",ratingValue:a.rating,bestRating:5},reviewBody:a.text}))}:{}}}function m(a){return{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:a.map((a,b)=>({"@type":"ListItem",position:b+1,name:a.name,item:f(a.path)}))}}}};