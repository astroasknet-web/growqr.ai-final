"use strict";exports.id=6438,exports.ids=[6438],exports.modules={5744:(a,b,c)=>{c.d(b,{P:()=>d});function d(a){return`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }

          body {
            margin: 0;
            padding: 0;
            background: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }

          .email-bg {
            background: #f3f4f6;
          }

          .container {
            width: 600px;
            max-width: 600px;
          }

          .surface {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
          }

          .hero {
            background: linear-gradient(135deg, #ff6b35 0%, #ff8f5c 100%);
          }

          .chip {
            display: inline-block;
            border: 1px solid #e5e7eb;
            border-radius: 999px;
            padding: 6px 10px;
            color: #4b5563;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            background: #ffffff;
          }

          .card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #ffffff;
          }

          .text-primary {
            color: #111827;
          }

          .text-muted {
            color: #4b5563;
          }

          .divider {
            border-top: 1px solid #e5e7eb;
          }

          .cta {
            display: inline-block;
            border-radius: 10px;
            padding: 12px 24px;
            font-weight: 700;
            text-decoration: none;
            background: #ff6b35;
            color: #ffffff !important;
          }

          .mobile-pad {
            padding: 28px;
          }

          @media only screen and (max-width: 620px) {
            .container {
              width: 100% !important;
              max-width: 100% !important;
            }

            .outer-pad {
              padding: 16px !important;
            }

            .mobile-pad {
              padding: 20px !important;
            }

            .hero-title {
              font-size: 22px !important;
              line-height: 1.25 !important;
            }

            .body-text {
              font-size: 15px !important;
              line-height: 1.6 !important;
            }
          }

          @media (prefers-color-scheme: dark) {
            body,
            .email-bg {
              background: #0b0d12 !important;
            }

            .surface {
              background: #111827 !important;
              border-color: #2b3342 !important;
            }

            .card {
              background: #0f172a !important;
              border-color: #2b3342 !important;
            }

            .chip {
              background: #111827 !important;
              border-color: #2b3342 !important;
              color: #c8d0de !important;
            }

            .text-primary {
              color: #f3f4f6 !important;
            }

            .text-muted {
              color: #c8d0de !important;
            }

            .divider {
              border-top-color: #2b3342 !important;
            }

            a {
              color: #ff9d76 !important;
            }
          }
        </style>
      </head>
      <body class="email-bg">
        ${a}
      </body>
    </html>
  `}},7230:(a,b,c)=>{c.d(b,{Qt:()=>f});var d=c(22080);let e=null;function f(){if(e)return e;let a=process.env.RESEND_API_KEY;if(!a)throw Error("RESEND_API_KEY is not set");return e=new d.u(a)}},18659:(a,b,c)=>{c.d(b,{bb:()=>u,pW:()=>s,rl:()=>t,Vn:()=>q,u7:()=>r});var d=c(64899),e=c(22191),f=c(43200),g=c(71430),h=c(7230),i=c(5744),j=c(86642),k=c(50303),l=c(85708);let m=["sahil@growqr.ai","support@growqr.ai"];function n(a,b){return b?`<p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">${(0,j.Z)(a)}:</strong> ${(0,j.Z)(b)}</p>`:""}async function o(a,b){let{subject:c,html:d}=function(a,b){let c=l.Bq[a.intent]??a.intent,d=`[GrowQR Bot] New ${c}`,e=new Date(a.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});return{subject:d,html:(0,i.P)(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR Bot</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">New ${(0,j.Z)(c)}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            ${n("Intent",c)}
                            ${n("Name",a.name)}
                            ${n("Email",a.email)}
                            ${n("Company",a.company)}
                            ${n("Team size",a.team_size)}
                            ${n("Country",(0,k.sM)(a.country_code))}
                            <div class="divider" style="height: 1px; margin: 10px 0 14px 0;"></div>
                            <p class="text-primary body-text" style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; font-weight: 700;">Original message</p>
                            <p class="text-muted body-text" style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.7;">${(0,j.Z)(a.use_case??"—")}</p>
                            <div class="divider" style="height: 1px; margin: 0 0 14px 0;"></div>
                            ${n("CRM Lead ID",b)}
                            ${n("Timestamp",e)}
                          </td>
                        </tr>
                      </table>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                        <tr>
                          <td align="left">
                            <a class="cta" href="mailto:${(0,j.Z)(a.email??"")}?subject=Re:%20GrowQR">Reply to ${(0,j.Z)(a.name??"lead")}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)}}(a,b);await (0,h.Qt)().emails.send({from:"GrowQR Bot <hello@growqr.ai>",to:m,subject:c,html:d})}let p=(0,e.h)("bot-crm");async function q(a){let b=(0,d.Zf)(),{data:c,error:e}=await b.rpc("resolve_bot_lead",{p_conversation_id:a.conversationId,p_avuid:a.avuid??void 0,p_intent:a.intent,p_email:a.email,p_name:a.name??void 0,p_company:a.company??void 0,p_designation:a.designation??void 0,p_team_size:a.teamSize??void 0,p_use_case:a.useCase??void 0,p_country_code:a.countryCode??void 0,p_page_path:a.pagePath??void 0,p_utm_source:a.utmSource??void 0,p_utm_medium:a.utmMedium??void 0,p_utm_campaign:a.utmCampaign??void 0}),f=c?.[0];return e||!f?(p.error(`queueBotLead failed for ${a.conversationId}:`,e),null):(p.info(`${a.conversationId} resolved to bot_leads#${f.lead_id} (matched_on=${f.matched_on}, visit=${f.visits}, requeued=${f.requeued})`),{leadId:f.lead_id,requeued:f.requeued})}async function r(a){if(!a.avuid)return void p.warn(`${a.conversationId} has no avuid — visitor tracking skipped`);let b=(0,d.Zf)(),{error:c}=await b.rpc("touch_bot_visitor",{p_avuid:a.avuid,p_conversation_id:a.conversationId,p_page_path:a.pagePath??void 0,p_country_code:a.countryCode??void 0,p_email:a.email??void 0});c&&p.error(`touchVisitor failed for ${a.avuid}:`,c)}async function s(a){let b=(0,d.Zf)(),{data:c,error:e}=await b.from("bot_leads").select("id, zoho_lead_id").or(`conversation_id.eq.${a.conversationId},conversation_ids.cs.{${a.conversationId}}`).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(e||!c)return p.warn(`changeLeadEmail: no lead for conversation ${a.conversationId}`,e),!1;let{error:h}=await b.from("bot_leads").update({email:a.email}).eq("id",c.id);if(h)return p.error(`changeLeadEmail: row update failed for bot_leads#${c.id}:`,h),!1;if(c.zoho_lead_id)try{await (0,f.Q6)(c.zoho_lead_id,{Email:a.email}),await (0,g.$)({conversationId:a.conversationId,leadId:c.id,eventType:"lead_created",payload:{zoho_lead_id:c.zoho_lead_id,action:"email_changed"}})}catch(a){p.error(`changeLeadEmail: Zoho update failed for lead ${c.zoho_lead_id}:`,a)}return!0}async function t(a){let b=(0,d.Zf)(),{error:c}=await b.from("bot_unanswered").insert({conversation_id:a.conversationId??null,question:a.question,page_path:a.pagePath??null,country_code:a.countryCode??null,answered_by:a.answeredBy??null});c&&p.error("logUnanswered failed:",c)}async function u(a,b){let c=(0,d.Zf)(),e={conversationId:a.conversation_id,leadId:a.id};if(await (0,g.$)({...e,eventType:"lead_created",payload:{zoho_lead_id:b.id,action:b.action}}),!a.zoho_task_created)try{let d=new Date(Date.now()+1728e5).toISOString().slice(0,10),h=l.Bq[a.intent]??a.intent;await (0,f.SD)({leadId:b.id,subject:`Follow up: ${h} — ${a.company??a.email??"unknown"}`,dueDate:d,description:a.use_case??void 0}),await c.from("bot_leads").update({zoho_task_created:!0}).eq("id",a.id),await (0,g.$)({...e,eventType:"task_created"})}catch(b){p.error(`bot_leads#${a.id} task creation failed:`,b),await (0,g.$)({...e,eventType:"task_created",status:"failed",payload:{error:b instanceof Error?b.message:String(b)}})}let h=a.visit_count??1;if((a.zoho_notes_count??0)<h)try{let d=[`Intent: ${a.intent}`,a.use_case?`Use case: ${a.use_case}`:null,a.designation?`Designation: ${a.designation}`:null,a.team_size?`Team size: ${a.team_size}`:null,a.last_page_path??a.page_path?`Page: ${a.last_page_path??a.page_path}`:null,h>1?`Visits so far: ${h}`:null,`SalesIQ conversation: ${a.conversation_ids?.at(-1)??a.conversation_id}`].filter(Boolean).join("\n");await (0,f.fi)({leadId:b.id,title:h>1?`Return visit ${h} via SalesIQ chat`:"Qualified via SalesIQ chat",content:d}),await c.from("bot_leads").update({zoho_notes_count:h,zoho_note_created:!0}).eq("id",a.id),await (0,g.$)({...e,eventType:"note_created",payload:{visit:h}})}catch(b){p.error(`bot_leads#${a.id} note creation failed:`,b),await (0,g.$)({...e,eventType:"note_created",status:"failed",payload:{error:b instanceof Error?b.message:String(b)}})}if(!a.notification_sent)if("general_inquiry"===a.intent)await c.from("bot_leads").update({notification_sent:!0}).eq("id",a.id);else try{await o(a,b.id),await c.from("bot_leads").update({notification_sent:!0}).eq("id",a.id),await (0,g.$)({...e,eventType:"email_sent"})}catch(b){p.error(`bot_leads#${a.id} notification failed:`,b),await (0,g.$)({...e,eventType:"email_sent",status:"failed",payload:{error:b instanceof Error?b.message:String(b)}})}}},22191:(a,b,c)=>{c.d(b,{h:()=>d});function d(a){let b=`[${a}]`;return{error:(...a)=>console.error(b,...a),warn:(...a)=>console.warn(b,...a),info:(...a)=>console.log(b,...a)}}},30468:(a,b,c)=>{c.d(b,{Q7:()=>m,W0:()=>g,eF:()=>p,tx:()=>q,val:()=>o,xH:()=>n});var d=c(3498),e=c.n(d);let f=globalThis;function g(){return/^mysql2?:\/\//i.test(process.env.DATABASE_URL??"")}function h(){if(f.__portalPool)return f.__portalPool;let a=e().createPool({...function(a=process.env.DATABASE_URL??""){if(!/^mysql2?:\/\//i.test(a))throw Error("DATABASE_URL must look like mysql://user:password@host:3306/database");let b=new URL(a.replace(/^mysql2:/i,"mysql:")),c=process.env.DATABASE_SSL??"disable";return{host:b.hostname,port:b.port?Number(b.port):3306,user:decodeURIComponent(b.username),password:decodeURIComponent(b.password),database:decodeURIComponent(b.pathname.replace(/^\//,"")),charset:"utf8mb4",timezone:"Z",dateStrings:!0,supportBigNumbers:!0,bigNumberStrings:!1,decimalNumbers:!0,flags:["+FOUND_ROWS"],ssl:"verify"===c?{}:"require"===c?{rejectUnauthorized:!1}:void 0}}(),waitForConnections:!0,connectionLimit:Number(process.env.DATABASE_POOL_MAX??5),queueLimit:0,connectTimeout:1e4,enableKeepAlive:!0}),b=/^[+-]\d{2}:\d{2}$/.test(process.env.DB_TIMEZONE??"")?process.env.DB_TIMEZONE:"+00:00";return a.on("connection",a=>{a.query(`SET time_zone = '${b}', sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION,PIPES_AS_CONCAT'`)}),f.__portalPool=a,a}let i={sec:"SECOND",secs:"SECOND",second:"SECOND",seconds:"SECOND",min:"MINUTE",mins:"MINUTE",minute:"MINUTE",minutes:"MINUTE",hour:"HOUR",hours:"HOUR",day:"DAY",days:"DAY",week:"WEEK",weeks:"WEEK",month:"MONTH",months:"MONTH",year:"YEAR",years:"YEAR"};function j(a,b){let c=[],d=/'(?:[^'\\]|\\.|'')*'|"(?:[^"\\]|\\.|"")*"|`[^`]*`|--[^\n]*|\/\*[\s\S]*?\*\//g,e=0;for(let f=d.exec(a);f;f=d.exec(a))c.push(b(a.slice(e,f.index)),f[0]),e=f.index+f[0].length;return c.push(b(a.slice(e))),c.join("")}function k(a,b=[]){let c=function(a){let b=a;for(let a=0;a<50;a++){let a=/\bFILTER\s*\(\s*WHERE\b/i.exec(b);if(!a)break;let c=b.indexOf("(",a.index),d=function(a,b){let c=0;for(let d=b;d<a.length;d++){let b=a[d];if("'"===b){for(d++;d<a.length&&("'"!==a[d]||"'"===a[d+1]);)d+="'"===a[d]?2:1;continue}if("("===b)c++;else if(")"===b&&0==--c)return d}return -1}(b,c);if(d<0)break;let e=b.slice(b.indexOf("WHERE",c)+5,d).trim(),f=b.slice(0,a.index).trimEnd(),g=/\bCOUNT\s*\(([^()]*)\)$/i.exec(f);if(!g)break;let h=g[1].trim(),i=/^DISTINCT\s+/i.test(h)?`COUNT(DISTINCT CASE WHEN ${e} THEN ${h.replace(/^DISTINCT\s+/i,"")} END)`:`SUM(CASE WHEN ${e} THEN 1 ELSE 0 END)`;b=f.slice(0,f.length-g[0].length)+i+b.slice(d+1)}return b}(a);/regexp_replace/i.test(c)&&(c=c.replace(/,\s*'g'\s*\)/gi,")")),c=(c=(c=(c=(c=c.replace(/\bAS\s+key\b/gi,"AS `key`")).replace(/([\w.]+)(\s+ASC)?\s+NULLS\s+LAST\b/gi,(a,b,c)=>`${b} IS NULL, ${b}${c??""}`)).replace(/(\$\d+|'[^']*')\s*=\s*ANY\(\s*string_to_array\(\s*([\w.]+)\s*,\s*','\s*\)\s*\)/gi,"FIND_IN_SET($1, $2) > 0")).replace(/([\w.]+)::date\b/gi,"DATE($1)")).replace(/\bAS\s+timestamp\b/gi,"AS DATETIME").replace(/\bAS\s+(?:integer|int|bigint)\b/gi,"AS SIGNED").replace(/\bAS\s+text\b/gi,"AS CHAR"),/\bOFFSET\b/i.test(c)&&!/\bLIMIT\b/i.test(c)&&(c=c.replace(/\bOFFSET\b/i,"LIMIT 18446744073709551615 OFFSET"));let d=null,e=!1,f=[];return c=(c=(c=j(c=c.replace(/INTERVAL\s+'\s*(\d+)\s+([a-z]+?)s?\s*'/gi,(a,b,c)=>`INTERVAL ${b} ${i[c.toLowerCase()]??i[`${c.toLowerCase()}s`]??c.toUpperCase()}`),a=>{let b=a;return(b=(b=(b=(b=b.replace(/::\s*[a-z_]+(?:\(\d+(?:\s*,\s*\d+)?\))?(?:\[\])?/gi,"")).replace(/=\s*ANY\(\s*(\$\d+)\s*\)/gi,"IN ($1)")).replace(/(?:<>|!=)\s*ALL\(\s*(\$\d+)\s*\)/gi,"NOT IN ($1)")).replace(/\bILIKE\b/gi,"LIKE")).replace(/make_interval\(\s*([a-z]+)\s*=>\s*([^()]+?)\s*\)/gi,(a,b,c)=>`INTERVAL (${c}) ${i[b.toLowerCase()]??b.toUpperCase()}`)})).replace(/\s+RETURNING\s+([\w\s,]+?)\s*$/i,(a,b)=>(d=b.split(",").map(a=>a.trim()).filter(Boolean),""))).replace(/\s+ON\s+CONFLICT\s*(?:\([^)]*\))?\s+DO\s+NOTHING\s*$/i,()=>(e=!0,"")),e&&(c=c.replace(/^\s*INSERT\s+INTO/i,"INSERT IGNORE INTO")),{sql:c=j(c=c.replace(/\s+ON\s+CONFLICT\s*(?:\([^)]*\))?\s+DO\s+UPDATE\s+SET\s+([\s\S]+)$/i,(a,b)=>` ON DUPLICATE KEY UPDATE ${b.replace(/\bEXCLUDED\.(\w+)/gi,"VALUES($1)")}`),a=>a.replace(/\$(\d+)/g,(a,c)=>{let d=b[Number(c)-1];return f.push(Array.isArray(d)&&0===d.length?null:d),"?"})),values:f,returning:d,insertIgnore:e}}async function l(a,b,c,d=!1){let e=k(b,c),[f]=await a.query({sql:e.sql,values:e.values,rowsAsArray:d});if(Array.isArray(f))return{rows:f,rowCount:f.length};if(e.returning){let a=f.affectedRows>0&&f.insertId?[{id:f.insertId}]:[];return{rows:a,rowCount:a.length}}return{rows:[],rowCount:f.affectedRows??0}}async function m(a,b=[]){return(await l(h(),a,b)).rows}async function n(a,b=[]){return(await m(a,b))[0]??null}async function o(a,b=[]){let c=k(a,b);if(c.returning){let d=await l(h(),a,b),e=d.rows[0]?.[c.returning[0]];return void 0===e?null:e}let d=await l(h(),a,b,!0),e=d.rows[0]?.[0];return void 0===e?null:e}async function p(a,b=[]){return(await l(h(),a,b)).rowCount}async function q(a){let b=await h().getConnection();try{await b.beginTransaction();let c=await a({query:(a,c=[])=>"string"==typeof a?l(b,a,c):l(b,a.text,a.values??[])});return await b.commit(),c}catch(a){throw await b.rollback().catch(()=>void 0),a}finally{b.release()}}},43200:(a,b,c)=>{c.d(b,{LQ:()=>r,ON:()=>p,Q6:()=>n,SD:()=>m,a9:()=>q,fi:()=>o,lC:()=>s,po:()=>f,yC:()=>k});let d=(0,c(22191).h)("zoho-client");function e(){let{ZOHO_CLIENT_ID:a,ZOHO_CLIENT_SECRET:b,ZOHO_REFRESH_TOKEN:c,ZOHO_ACCOUNTS_BASE:d,ZOHO_API_BASE:e}=process.env;if(!a||!b||!c||!d||!e)throw new f("Zoho env vars are not configured",{retryable:!1});return{clientId:a,clientSecret:b,refreshToken:c,accountsBase:d,apiBase:e}}class f extends Error{constructor(a,b){super(a,{cause:b.cause}),this.name="ZohoApiError",this.retryable=b.retryable,this.status=b.status,this.code=b.code}}let g=a=>429===a||a>=500,h=null;async function i(a=!1){let b;if(!a&&h&&Date.now()<h.expiresAt)return h.value;let c=e();try{b=await fetch(`${c.accountsBase}/oauth/v2/token`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"refresh_token",client_id:c.clientId,client_secret:c.clientSecret,refresh_token:c.refreshToken})})}catch(a){throw new f("Zoho token request failed (network)",{retryable:!0,cause:a})}if(!b.ok)throw new f(`Zoho token endpoint returned ${b.status}`,{retryable:g(b.status),status:b.status});let d=await b.json();if(!d.access_token)throw new f(`Zoho token refresh rejected: ${d.error??"no access_token"}`,{retryable:!1,code:d.error});let j=(d.expires_in??3600)*1e3;return h={value:d.access_token,expiresAt:Date.now()+j-6e4},d.access_token}async function j(a,b){let c=e(),g=async d=>{try{return await fetch(`${c.apiBase}${a}`,{...b,headers:{...b.headers,Authorization:`Zoho-oauthtoken ${d}`}})}catch(a){throw new f("Zoho API request failed (network)",{retryable:!0,cause:a})}},h=await g(await i());return 401===h.status&&(d.warn("401 from Zoho API, refreshing access token"),h=await g(await i(!0))),h}async function k(a){let b=await j("/crm/v8/Leads/upsert",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[a],duplicate_check_fields:["Email"]})});if(!b.ok)throw new f(`Zoho upsert returned ${b.status}`,{retryable:g(b.status),status:b.status});let c=await b.json(),d=c.data?.[0];if(d?.code!=="SUCCESS"||!d.details?.id)throw new f(`Zoho rejected the record: ${d?.message??"unknown"}`,{retryable:!1,code:d?.code});return{id:String(d.details.id),action:"update"===d.action?"update":"insert"}}async function l(a,b){if(!a.ok)throw new f(`Zoho ${b} returned ${a.status}`,{retryable:g(a.status),status:a.status});let c=await a.json(),d=c.data?.[0];if(d?.code!=="SUCCESS"||!d.details?.id)throw new f(`Zoho rejected the ${b}: ${d?.message??"unknown"}`,{retryable:!1,code:d?.code});return String(d.details.id)}async function m(a){return l(await j("/crm/v8/Tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[{Subject:a.subject,What_Id:{id:a.leadId},$se_module:"Leads",Status:"Not Started",Priority:"High",Due_Date:a.dueDate,Description:a.description}]})}),"task")}async function n(a,b){let c=await j(`/crm/v8/Leads/${a}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[b]})});await l(c,"lead update")}async function o(a){return l(await j(`/crm/v8/Leads/${a.leadId}/Notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[{Note_Title:a.title,Note_Content:a.content}]})}),"note")}async function p(a){let b=await j(`/crm/v8/Contacts/search?email=${encodeURIComponent(a)}`,{method:"GET"});if(204===b.status)return null;if(!b.ok)throw new f(`Zoho contact search returned ${b.status}`,{retryable:g(b.status),status:b.status});let c=await b.json(),d=c.data?.[0]?.id;return d?String(d):null}async function q(a){return l(await j("/crm/v8/Tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[{Subject:a.subject,Who_Id:{id:a.contactId},$se_module:"Contacts",Status:"Not Started",Priority:"High",Due_Date:a.dueDate,Description:a.description}]})}),"contact task")}async function r(a){return l(await j(`/crm/v8/Contacts/${a.contactId}/Notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[{Note_Title:a.title,Note_Content:a.content}]})}),"contact note")}async function s(a,b){let c=await j(`/crm/v8/Tasks/${a}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:[b]})});await l(c,"task update")}},50303:(a,b,c)=>{c.d(b,{$n:()=>s,D1:()=>u,DD:()=>n,Fz:()=>f,HI:()=>h,W0:()=>g,sG:()=>p,sM:()=>j,tQ:()=>w,yP:()=>e});let d={audience:null,businessUnit:null,productInterest:null},e={Student:{businessUnit:"Individual",productInterest:"Q-Ryze"},Professional:{businessUnit:"Individual",productInterest:"Q-Ryze"},Freelancer:{businessUnit:"Individual",productInterest:"Q-Ryze"},Coach:{businessUnit:"Talent",productInterest:"Q-Kalyber"},Recruiter:{businessUnit:"Talent",productInterest:"Q-Kalyber"},Institute:{businessUnit:"EdTech",productInterest:"Q-Kampus"},Enterprise:{businessUnit:"Enterprise",productInterest:"Q-Skale"}};function f(a){return a?{audience:a,...e[a]}:d}function g(a){let b=a.trim().replace(/\s+/g," "),c=b.lastIndexOf(" ");return -1===c?{firstName:null,lastName:b}:{firstName:b.slice(0,c),lastName:b.slice(c+1)}}function h(a){switch(a){case"IN":return"India";case"US":return"USA";case"AE":return"UAE";case"SG":return"Singapore";default:return"Other"}}let i={IN:"India",AE:"United Arab Emirates",TR:"T\xfcrkiye",GE:"Georgia",LK:"Sri Lanka",NP:"Nepal",TH:"Thailand",BR:"Brazil",AR:"Argentina",MT:"Malta",NO:"Norway",SE:"Sweden",CH:"Switzerland",US:"United States",SG:"Singapore",GB:"United Kingdom",CA:"Canada",AU:"Australia",NZ:"New Zealand",DE:"Germany",FR:"France",NL:"Netherlands",ES:"Spain",IT:"Italy",PT:"Portugal",IE:"Ireland",PL:"Poland",PK:"Pakistan",BD:"Bangladesh",ID:"Indonesia",MY:"Malaysia",PH:"Philippines",VN:"Vietnam",JP:"Japan",KR:"South Korea",CN:"China",HK:"Hong Kong S.A.R.",SA:"Saudi Arabia",QA:"Qatar",KW:"Kuwait",OM:"Oman",BH:"Bahrain",EG:"Egypt",NG:"Nigeria",KE:"Kenya",ZA:"South Africa",MX:"Mexico",IL:"Israel"};function j(a){return a?i[a]??null:null}let k=new Set(["cpc","ppc","paid","paid_social"]),l=new Set(["linkedin","facebook","instagram","twitter","x","youtube"]),m=["google.","bing.","duckduckgo.","search.yahoo.","baidu.","yandex.","ecosia."];function n(a){let b=a.utm_source?.toLowerCase()??null,c=a.utm_medium?.toLowerCase()??null;if(a.gclid||c&&k.has(c))return"Paid Ads";if("email"===c)return"Email Campaign";if(b&&l.has(b))return"Social Media";if("partner"===b||"partnership"===c)return"Partner";let d=function(a){if(!a)return null;try{return new URL(a).hostname.toLowerCase()}catch{return null}}(a.referrer);if("referral"===c)return"Referral";if(d&&!d.endsWith("growqr.ai"))return m.some(a=>d.startsWith(a)||d.includes(`.${a}`))?"Organic Search":"Referral";return"Website"}let o={"GrowQR Enterprise":"Enterprise",Enterprises:"Enterprise",Startups:"Enterprise",Recruiters:"Recruiter",Institutes:"Institute"};function p(a,b){return a?f("Enterprise"):b?f(o[b]??null):d}let q=new Set(["navbar","navbar-mobile","homepage-hero","homepage-pricing","roadmaps-cta","final-cta","journey-cta"]),r=[["/solutions/students","Student"],["/solutions/professionals","Professional"],["/solutions/coaches","Coach"],["/solutions/freelancers","Freelancer"]];function s(a,b=null){return!a||q.has(a)?f(function(a){if(!a)return null;let b=a.split("?")[0].replace(/\/+$/,"").toLowerCase()||"/",c=r.find(([a])=>b===a||b.startsWith(`${a}/`));return c?c[1]:b.startsWith("/agents/")||b.startsWith("/ai-")?"Professional":null}(b)):a.startsWith("students")?f("Student"):a.startsWith("coaches")?f("Coach"):a.startsWith("freelancers")?f("Freelancer"):f("Professional")}let t=new Set(["gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com","yahoo.com","ymail.com","icloud.com","me.com","mac.com","aol.com","proton.me","protonmail.com","mail.com","gmx.com","zoho.com","rediffmail.com","yandex.com"]);function u(a){let b=a.trim().toLowerCase().split("@").pop()??"";return!b||t.has(b)?{segment:"B2C",company:null}:{segment:"B2B",company:b}}let v={"1–50":50,"51–200":200,"201–1,000":1e3,"1,000+":1001};function w(a){return a?v[a]??null:null}Object.values(i)},51011:(a,b,c)=>{c.d(b,{TM:()=>i,jM:()=>k,m:()=>j});var d=c(64899),e=c(22191),f=c(43200),g=c(56567);let h=(0,e.h)("crm-sync");async function i(a,b){if(!(0,g.x)())return{outcome:"sync_disabled"};let c=g.u[a];return c.enabled?l(c,b):{outcome:"source_disabled"}}let j=5;async function k(a=l,b=Object.values(g.u)){let c=(0,d.Zf)(),e=new Date(Date.now()-6e5).toISOString(),f={};for(let d of b){if(!d.enabled)continue;let b={reaped:0,synced:0,failed:0,skipped:0,capped:!1,afterSyncRetried:0};f[d.table]=b;let{data:g,error:i}=await c.from(d.table).update({crm_sync_status:"pending"}).eq("crm_sync_status","syncing").lt("created_at",e).select("id");i?h.error(`${d.table} reaper failed:`,i):g?.length&&(b.reaped=g.length,h.warn(`${d.table} reaped ${g.length} stale syncing row(s)`));let k=new Set;for(;k.size<200;){let{data:f,error:g}=await c.from(d.table).select("id").in("crm_sync_status",["pending","failed"]).lt("crm_sync_attempts",j).lt("created_at",e).order("created_at",{ascending:!0}).limit(25);if(g){h.error(`${d.table} sweep select failed:`,g);break}let i=(f??[]).map(a=>a.id).filter(a=>!k.has(a));if(!i.length)break;for(let c of i){k.add(c);let e=await a(d,c);if("synced"===e.outcome?b.synced+=1:"failed"===e.outcome?b.failed+=1:"skipped"===e.outcome&&(b.skipped+=1),k.size>=200)break}}if(k.size>=200&&(b.capped=!0,h.warn(`${d.table} sweep hit the 200-row budget — backlog remains`)),d.afterSync&&d.afterSyncFilter){let{data:a,error:e}=await c.from(d.table).select("*").eq("crm_sync_status","synced").or(d.afterSyncFilter).order("created_at",{ascending:!0}).limit(25);if(e)h.error(`${d.table} afterSync reconciliation select failed:`,e);else for(let c of a??[]){let a=c.zoho_lead_id??c.zoho_contact_id??null;if(a)try{await d.afterSync(c,{id:a,type:"contact"===c.crm_record_type?"contact":"lead",action:"update"}),b.afterSyncRetried+=1}catch(a){h.error(`${d.table}#${c.id} afterSync reconciliation retry failed:`,a)}}}}return f}async function l(a,b){let c=(0,d.Zf)(),e=`${a.table}#${b}`,{data:g,error:i}=await c.from(a.table).update({crm_sync_status:"syncing"}).eq("id",b).in("crm_sync_status",["pending","failed"]).select().maybeSingle();if(i)return h.error(`${e} claim failed:`,i),{outcome:"failed",error:i.message,retryable:!0};if(!g)return{outcome:"not_claimed"};let j=async d=>{let{error:f}=await c.from(a.table).update(d).eq("id",b);f&&h.error(`${e} write-back failed:`,f)},k=a.buildPayload(g);if(!k)return await j({crm_sync_status:"skipped"}),h.info(`${e} outcome=skipped (excluded by rule)`),{outcome:"skipped"};let l=(g.crm_sync_attempts??0)+1;try{let b=a.resolvePerson?await a.resolvePerson(k):{type:"lead",...await (0,f.yC)({...k})};if(await j({crm_sync_status:"synced",..."lead"===b.type?{zoho_lead_id:b.id}:{zoho_contact_id:b.id},...a.resolvePerson?{crm_record_type:b.type}:{},crm_synced_at:new Date().toISOString(),crm_sync_attempts:l,crm_sync_error:null}),h.info(`${e} outcome=synced type=${b.type} action=${b.action} zoho_id=${b.id}`),a.afterSync)try{await a.afterSync(g,b)}catch(a){h.error(`${e} afterSync hook failed:`,a)}return{outcome:"synced",zohoLeadId:b.id,action:b.action}}catch(c){let a=!(c instanceof f.po)||c.retryable,b=c instanceof Error?c.message:String(c);return await j({crm_sync_status:"failed",crm_sync_attempts:l,crm_sync_error:b}),h.error(`${e} outcome=failed retryable=${a} attempts=${l}:`,c),{outcome:"failed",error:b,retryable:a}}}},56567:(a,b,c)=>{c.d(b,{u:()=>z,x:()=>A});let d=new Set(["students","professionals","freelancers","coaches","consultants","institutes","recruiters","enterprises","startups"]),e={students:"Student",recruiters:"Recruiter",institutes:"Institute",enterprises:"Enterprise",startups:"Enterprise"};function f(a){let[b,c]=a.split("?");if(/^\/enterprise(\/|$)/.test(b))return{solution:"enterprises",audience:"Enterprise"};let f=b.match(/^\/solutions\/([a-z-]+)/),g=f?.[1];return g&&d.has(g)?{solution:g,audience:e[g]??"Professional"}:/^\/ai-/.test(b)?{solution:"professionals",audience:"Professional"}:"/agents"===b&&"enterprise"===new URLSearchParams(c??"").get("mode")?{solution:"enterprises",audience:"Enterprise"}:{solution:null,audience:null}}var g=c(85708),h=c(81253),i=c(50303);let j="https://growqr.ai";function k(a){let b={utm_source:a.utm_source,utm_medium:a.utm_medium,utm_campaign:a.utm_campaign,utm_term:a.utm_term,utm_content:a.utm_content,gclid:a.gclid,landing_page:a.landing_page,referrer:a.referrer,page_path:a.page_path},c=a.landing_page?a.landing_page.startsWith("/")?`${j}${a.landing_page}`:a.landing_page:void 0;return{Lead_Status:"New",Lead_Source:(0,i.DD)(b),Region:(0,i.HI)(a.country_code),Country:(0,i.sM)(a.country_code)??void 0,UTM_Source:a.utm_source??void 0,UTM_Medium:a.utm_medium??void 0,UTM_Campaign:a.utm_campaign??void 0,UTM_Term:a.utm_term??void 0,UTM_Content:a.utm_content??void 0,Google_Click_ID:a.gclid??void 0,Landing_Page_URL:c}}function l(a){return Object.fromEntries(Object.entries("B2C"===a.Segment?{...a,Company:void 0}:a).filter(([,a])=>void 0!==a))}let m={recruiter_inquiry:"Recruiter",university_inquiry:"Institute",enterprise_inquiry:"Enterprise"};function n(a){return a&&a in i.yP?a:null}let o=new Set(["Student","Professional"]);var p=c(18659),q=c(64899),r=c(22191),s=c(43200);let t=(0,r.h)("crm-call-booking");async function u(a){let b=await (0,s.ON)(a.Email);return b?(t.info(`${a.Email} is an existing Contact (${b}) — no Lead created`),{type:"contact",id:b,action:"update"}):{type:"lead",...await (0,s.yC)({...a})}}function v(a){return new Date(new Date(a).getTime()+198e5).toISOString().slice(0,10)}function w(a){return`${new Date(a).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"})} IST`}function x(a){return[`Status: ${a.status}`,`Scheduled: ${w(a.start_time)}`,a.attendee_timezone?`Attendee timezone: ${a.attendee_timezone}`:null,a.company?`Company: ${a.company}`:null,a.team_size?`Team size: ${a.team_size}`:null,a.source?`Booked from: ${a.source}`:null,a.page_path?`Page: ${a.page_path}`:null,a.utm_campaign?`Campaign: ${a.utm_campaign}`:null,a.meeting_url?`Meeting: ${a.meeting_url}`:null,a.cancellation_reason?`Cancellation reason: ${a.cancellation_reason}`:null].filter(Boolean).join("\n")}async function y(a,b){let c=(0,q.Zf)(),d=(0,h.pv)(a.cal_event_type_id),e=a.company?.trim()||a.attendee_name||a.email,f="contact"===b.type;if(a.zoho_task_created){if(a.zoho_task_id&&("cancelled"===a.status||"rescheduled"===a.status))try{await (0,s.lC)(a.zoho_task_id,"cancelled"===a.status?{Subject:`Call CANCELLED: ${e} — was ${w(a.start_time)}`,Status:"Deferred"}:{Subject:`Call scheduled: ${e} — ${w(a.start_time)}`,Due_Date:v(a.start_time)})}catch(b){t.error(`call_bookings#${a.id} task update failed:`,b)}}else try{let d="cancelled"===a.status?`Call CANCELLED: ${e} — was ${w(a.start_time)}`:`Call scheduled: ${e} — ${w(a.start_time)}`,g=f?await (0,s.a9)({contactId:b.id,subject:d,dueDate:v(a.start_time),description:x(a)}):await (0,s.SD)({leadId:b.id,subject:d,dueDate:v(a.start_time),description:x(a)});await c.from("call_bookings").update({zoho_task_created:!0,zoho_task_id:g}).eq("id",a.id)}catch(b){t.error(`call_bookings#${a.id} task creation failed:`,b)}let g=a.events_count??1;if((a.zoho_notes_count??0)<g)try{let e="cancelled"===a.status?`Call cancelled (${d})`:"rescheduled"===a.status?`Call rescheduled (${d})`:`Call booked via Cal.com (${d})`;f?await (0,s.LQ)({contactId:b.id,title:e,content:x(a)}):await (0,s.fi)({leadId:b.id,title:e,content:x(a)}),await c.from("call_bookings").update({zoho_notes_count:g}).eq("id",a.id)}catch(b){t.error(`call_bookings#${a.id} note creation failed:`,b)}}let z={b2b_leads:{table:"b2b_leads",enabled:!0,buildPayload:function(a){let{firstName:b,lastName:c}=(0,i.W0)(a.name),{audience:d,businessUnit:e,productInterest:f}=(0,i.sG)(a.agent,a.solution),g=[`Submitted via enterprise contact form on ${a.page_path??"unknown page"}`,a.agent?`agent: ${a.agent}`:null,a.solution?`solution: ${a.solution}`:null,a.team_size?`team size: ${a.team_size}`:null].filter(Boolean).join(" | ");return l({...k(a),Last_Name:c,First_Name:b??void 0,Email:a.email,Company:a.company,Segment:"B2B",Audience:d??void 0,Business_Unit:e??void 0,Product_Interest:f??void 0,No_of_Employees:(0,i.tQ)(a.team_size)??void 0,Description:a.message?`— ${g} —

${a.message}`:`— ${g} —`})}},contact_messages:{table:"contact_messages",enabled:!0,buildPayload:function(a){if("sales"!==a.type)return null;let{firstName:b,lastName:c}=(0,i.W0)(a.name),{segment:d,company:e}=(0,i.D1)(a.email),f=[`Submitted via contact form (sales) on ${a.page_path??"unknown page"}`,a.subject?`subject: ${a.subject}`:null].filter(Boolean).join(" | ");return l({...k(a),Last_Name:c,First_Name:b??void 0,Email:a.email,Company:e??void 0,Segment:d,Description:`— ${f} —

${a.message}`})}},seeker_waitlist:{table:"seeker_waitlist",enabled:!0,buildPayload:function(a){let{audience:b,businessUnit:c,productInterest:d}=(0,i.$n)(a.source,a.page_path),e=a.email.split("@")[0]||a.email,f=[a.source?`Joined seeker waitlist via '${a.source}' CTA`:"Joined seeker waitlist",a.page_path?`on ${a.page_path}`:null].filter(Boolean).join(" ");return l({...k(a),Last_Name:e,Email:a.email,Segment:"B2C",Audience:b??void 0,Business_Unit:c??void 0,Product_Interest:d??void 0,Description:`— ${f} —`})}},bot_leads:{table:"bot_leads",enabled:!0,buildPayload:function(a){if(!a.email)return null;let{firstName:b,lastName:c}=(0,i.W0)(a.name??a.email.split("@")[0]??a.email),d=(0,i.Fz)(function(a){let b=m[a.intent];if(b)return b;let c=a.last_page_path??a.page_path;return"/"===c?"Professional":c?n(f(c).audience):null}(a)),{segment:e,company:h}=(0,i.D1)(a.email),k="general_inquiry"!==a.intent,p=k&&d.audience&&o.has(d.audience)?{audience:null,businessUnit:null,productInterest:null}:d,q=k?"B2B":p.audience?o.has(p.audience)?"B2C":"B2B":e,r=p.audience??(k?null:void 0),s=p.businessUnit??(k?null:void 0),t=p.productInterest??(k?null:void 0),u={utm_source:a.utm_source,utm_medium:a.utm_medium,utm_campaign:a.utm_campaign,utm_term:null,utm_content:null,gclid:null,landing_page:a.page_path,referrer:null,page_path:a.page_path},v=a.page_path?a.page_path.startsWith("/")?`${j}${a.page_path}`:a.page_path:void 0,w=g.Bq[a.intent]??a.intent,x=[`Qualified via SalesIQ bot (${w})`,a.page_path?`on ${a.page_path}`:null,a.designation?`designation: ${a.designation}`:null,a.team_size?`team size: ${a.team_size}`:null].filter(Boolean).join(" | ");return l({Lead_Status:"New",Lead_Source:(0,i.DD)(u),Region:(0,i.HI)(a.country_code),Country:(0,i.sM)(a.country_code)??void 0,UTM_Source:a.utm_source??void 0,UTM_Medium:a.utm_medium??void 0,UTM_Campaign:a.utm_campaign??void 0,Landing_Page_URL:v,Last_Name:c,First_Name:b??void 0,Email:a.email,Company:a.company||h||void 0,Segment:q,Audience:r,Business_Unit:s,Product_Interest:t,No_of_Employees:(0,i.tQ)(a.team_size)??void 0,Description:a.use_case?`— ${x} —

${a.use_case}`:`— ${x} —`})},afterSync:p.bb,afterSyncFilter:"zoho_task_created.eq.false,zoho_notes_pending.eq.true,notification_sent.eq.false"},call_bookings:{table:"call_bookings",enabled:!0,buildPayload:function(a){if(a.is_disposable_email||"cancelled"===a.status&&!a.zoho_lead_id&&!a.zoho_contact_id)return null;let{firstName:b,lastName:c}=(0,i.W0)(a.attendee_name),{segment:d,company:e}=(0,i.D1)(a.email),g=(0,h.SY)(a.source),j=g?(0,i.Fz)(function(a){let b=a?n(f(a).audience):null;return b?o.has(b)?null:b:null}(a.page_path)):(0,i.Fz)(a.page_path?n(f(a.page_path).audience):null),m=g?null:void 0,p=(0,h.pv)(a.cal_event_type_id),q=new Date(a.start_time).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}),r=[`Booked a ${p} via Cal.com`,a.source?`source: ${a.source}`:null,a.page_path?`on ${a.page_path}`:null,`scheduled: ${q} IST`,"booked"!==a.status?`status: ${a.status}`:null,a.team_size?`team size: ${a.team_size}`:null].filter(Boolean).join(" | ");return l({...k(a),Last_Name:c,First_Name:b??void 0,Email:a.email,Company:a.company?.trim()||e||void 0,Segment:g?"B2B":"B2C"===d?"B2C":void 0,Audience:j.audience??m,Business_Unit:j.businessUnit??m,Product_Interest:j.productInterest??m,No_of_Employees:(0,i.tQ)(a.team_size)??void 0,Description:a.meeting_url?`— ${r} —

Meeting link: ${a.meeting_url}`:`— ${r} —`})},resolvePerson:u,afterSync:y,afterSyncFilter:"zoho_task_created.eq.false,zoho_notes_pending.eq.true"}};function A(){return"true"===process.env.CRM_SYNC_ENABLED}},71430:(a,b,c)=>{c.d(b,{$:()=>f});var d=c(64899);let e=(0,c(22191).h)("bot-events");async function f(a){let b=(0,d.Zf)(),{error:c}=await b.from("bot_events").insert({conversation_id:a.conversationId??null,lead_id:a.leadId??null,event_type:a.eventType,status:a.status??"ok",payload:a.payload??null});c&&e.error(`logEvent(${a.eventType}) failed:`,c)}},81253:(a,b,c)=>{c.d(b,{$u:()=>h,Ry:()=>e,SY:()=>g,kc:()=>d,pv:()=>k,rp:()=>i});let d="https://cal.com",e=["b2b-enterprise-modal","enterprise-hero","enterprise-final-cta","brand-intelligence","persona-cta","seeker-waitlist-modal"],f=new Set(["seeker-waitlist-modal"]),g=a=>i(a)&&!f.has(a),h=a=>i(a)&&f.has(a),i=a=>e.includes(a),j={6292341:{slug:"15-min-intro-call",label:"15-minute intro call",durationMins:15}},k=a=>(function(a){return null!=a?j[a]??null:null})(a)?.label??"call"},85708:(a,b,c)=>{c.d(b,{AZ:()=>h,Bq:()=>f,To:()=>e,kD:()=>k});let d=["demo_request","recruiter_inquiry","university_inquiry","enterprise_inquiry"];function e(a){return d.includes(a)}let f={demo_request:"Enquiry Request",recruiter_inquiry:"Recruiter Inquiry",university_inquiry:"University Inquiry",enterprise_inquiry:"Enterprise Inquiry",general_inquiry:"General Inquiry",pricing:"Pricing",human_request:"Human Request",change_email:"Change Email",fallback:"Fallback"},g=["talk to a human","talk to human","speak to a human","talk to someone","speak to someone","talk to our team","talk to your team","connect me with support","connect me to support","connect me with someone","customer support","customer service","real person","live agent","human agent","support agent","talk to an agent","speak to an agent","chat with an agent","connect me with an agent","connect me to an agent","representative","connect with human","connect with a human"];function h(a){let b=a.toLowerCase();return g.some(a=>b.includes(a))}let i={change_email:["change email","change my email","different email","another email","wrong email","update email","use a different email","edit email"],human_request:[...g,"not helpful","didn't help","didnt help","did not help","wrong","confused","i need help","need help","support","human"],demo_request:["demo","book a call","enquire now","walkthrough","schedule a call","see it in action"],pricing:["price","pricing","cost","how much","plans","plan","subscription"]},j=/\b(ai\s+agents?|rq-\w+|vera|nova|mira|scout|sage|kai|lyra|rita|rohan|eva|finn|maya|theo)\b|\b(what|which|list|all|how\s+many|your)\s+agents?\b/i;function k(a){let b=a.toLowerCase(),c=j.test(a);for(let a of["change_email","human_request","demo_request","pricing"])if(("human_request"!==a||!c)&&i[a].some(a=>b.includes(a)))return a;return"fallback"}},86642:(a,b,c)=>{c.d(b,{Z:()=>d});function d(a){return null==a?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}}};