"use strict";(()=>{var a={};a.id=1668,a.ids=[1668],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3498:a=>{a.exports=require("mysql2/promise")},7230:(a,b,c)=>{c.d(b,{Qt:()=>f});var d=c(22080);let e=null;function f(){if(e)return e;let a=process.env.RESEND_API_KEY;if(!a)throw Error("RESEND_API_KEY is not set");return e=new d.u(a)}},8409:(a,b,c)=>{c.d(b,{I:()=>e});let d=["new","screening","shortlisted","interview","selected","offer","joined"];function e(a,b){let c=d.indexOf(a),e=d.indexOf(b);return c<0||e<0?null:e>c?b:null}},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33112:(a,b,c)=>{c.a(a,async(a,d)=>{try{let z;c.r(b),c.d(b,{GET:()=>x,POST:()=>y,dynamic:()=>A});var e=c(29021),f=c.n(e),g=c(33873),h=c.n(g),i=c(74515),j=c(10641),k=c(78591),l=c(64899),m=c(53500),n=c(94991),o=c(43542),p=c(44695),q=c(59811),r=c(2137),s=c(8409),t=a([k,p]);[k,p]=t.then?(await t)():t;let A="force-dynamic",B=h().join(process.cwd(),"public","emailogo.png");function u(a){return j.NextResponse.json({error:a},{status:400})}function v(a){let b=new Date(a);return Number.isNaN(b.getTime())?a:b.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}let C=/^\d{4}-\d{2}-\d{2}$/;function w(a,b,c){return{date:c,referenceNo:a.referenceNo,internName:b.full_name,internEmail:b.email,designation:a.designation,department:a.department,startDate:v(a.startDate),endDate:a.endDate?v(a.endDate):a.duration,duration:a.duration,reportingManager:a.reportingManager,location:a.location,signatoryName:a.signatoryName??void 0,signatoryTitle:a.signatoryTitle??void 0}}async function x(a){if(!await (0,n.j)())return j.NextResponse.json({error:"Unauthorized"},{status:401});let b=new URL(a.url).searchParams.get("applicationId")?.trim()??"";if(!b)return u("Missing applicationId");let c=(0,l.Zf)(),{data:d}=await c.from("internship_applications").select("full_name, email").eq("id",b).single();if(!d)return j.NextResponse.json({error:"Application not found"},{status:404});let{data:e}=await c.from("internship_appointments").select("*").eq("application_id",b).maybeSingle();if(!e)return new j.NextResponse("<p style='font-family:sans-serif;padding:24px'>No appointment letter prepared yet. Fill in the particulars and save first.</p>",{status:200,headers:{"content-type":"text/html; charset=utf-8"}});let f=w({referenceNo:e.reference_no,designation:e.designation,department:e.department,startDate:e.start_date,endDate:e.end_date,duration:e.duration,reportingManager:e.reporting_manager,location:e.location,signatoryName:e.signatory_name,signatoryTitle:e.signatory_title},d,v(e.issued_at??new Date().toISOString()));return new j.NextResponse((0,o.g2)(f),{status:200,headers:{"content-type":"text/html; charset=utf-8"}})}async function y(a){let b,c=await (0,n.j)();if(!c)return j.NextResponse.json({error:"Unauthorized"},{status:401});let d=await a.json().catch(()=>null);if(!d)return u("Invalid request body");let e="string"==typeof d.applicationId?d.applicationId:"",g="send"===d.action?"send":"save";if(!e)return u("Missing applicationId");let h=function(a,b){let c=a=>"string"==typeof a?a.trim():"",d=c(a.designation).slice(0,200),e=c(a.department).slice(0,200),f=c(a.startDate),g=c(a.endDate),h=c(a.duration).slice(0,100),i=c(a.reportingManager).slice(0,200),j=c(a.location).slice(0,200);if(!d)return"Designation is required";if(!e)return"Department is required";if(!C.test(f))return"A valid start date is required";if(g&&!C.test(g))return"End date must be a valid date";if(!h)return"Duration is required";if(!i)return"Reporting manager is required";if(!j)return"Work location is required";let k=new Date().getFullYear();return{referenceNo:c(a.referenceNo).slice(0,60)||`GQR/INT/${k}/${b.replace(/-/g,"").slice(-4).toUpperCase()}`,designation:d,department:e,startDate:f,endDate:g||null,duration:h,reportingManager:i,location:j,signatoryName:c(a.signatoryName).slice(0,200)||null,signatoryTitle:c(a.signatoryTitle).slice(0,200)||null}}(d,e);if("string"==typeof h)return u(h);let o=(0,l.Zf)(),{data:t,error:x}=await o.from("internship_applications").select("id, full_name, email, status").eq("id",e).single();if(x||!t)return j.NextResponse.json({error:"Application not found"},{status:404});let y={application_id:e,reference_no:h.referenceNo,designation:h.designation,department:h.department,start_date:h.startDate,end_date:h.endDate,duration:h.duration,reporting_manager:h.reportingManager,location:h.location,signatory_name:h.signatoryName,signatory_title:h.signatoryTitle,created_by:c.email??null},{error:A}=await o.from("internship_appointments").upsert(y,{onConflict:"application_id"});if(A)return j.NextResponse.json({error:A.message},{status:500});if("save"===g)return j.NextResponse.json({success:!0,referenceNo:h.referenceNo});let D=v(new Date().toISOString()),E=w(h,t,D);try{b=await (0,k.renderToBuffer)((0,i.createElement)(p.e,{params:E,logoSrc:function(){if(void 0!==z)return z??void 0;try{z=`data:image/png;base64,${f().readFileSync(B).toString("base64")}`}catch(a){console.warn("[appointment] wordmark unavailable, rendering letter without it:",a),z=null}return z??void 0}()}))}catch(a){return console.error("[appointment] PDF render failed:",a),j.NextResponse.json({error:"Could not generate the letter PDF."},{status:500})}let F=(0,q.HO)(t.full_name,h.designation),G=h.referenceNo.replace(/[^a-zA-Z0-9]+/g,"-"),H=await (0,r.l)({applicationId:e,kind:"appointment_letter",to:t.email,subject:F.subject,html:F.html,attachments:[{filename:`${G}.pdf`,content:b}],sentBy:c.email??null});if(!H.ok)return j.NextResponse.json({error:`The letter could not be emailed. ${H.error??""}`.trim()},{status:502});let I=new Date().toISOString();await o.from("internship_appointments").update({issued_at:I}).eq("application_id",e);let J=(0,s.I)(t.status,"offer");return J&&await o.from("internship_applications").update({status:J}).eq("id",e),(0,m.g)({admin_email:c.email,admin_id:c.id,action_type:"details_updated",target_id:e,target_name:t.full_name,new_value:`Appointment letter issued (${h.referenceNo})`,details:{module:"internship",appointment_ref:h.referenceNo}}).catch(a=>console.error("Appointment log failed:",a)),j.NextResponse.json({success:!0,referenceNo:h.referenceNo,issuedAt:I})}d()}catch(a){d(a)}})},33873:a=>{a.exports=require("path")},43542:(a,b,c)=>{c.d(b,{Kq:()=>f,g2:()=>h});var d=c(86642),e=c(57600);let f={legalName:"GrowQR Private Limited",tradingName:"GrowQR",site:"www.growqr.ai",email:"hello@growqr.ai",address:{line1:"4th Floor, Wesource Building",line2:"Sector 125, Noida",line3:"Uttar Pradesh 201313, India"}};function g(a,b){return`
          <tr>
            <th scope="row">${(0,d.Z)(a)}</th>
            <td>${(0,d.Z)(b)}</td>
          </tr>`}function h(a,b={}){let c=a.signatoryName??"Authorised Signatory",i=a.signatoryTitle??`For ${f.legalName}`,j=(0,d.Z)(a.internName.trim().split(/\s+/)[0]??""),k=b=>`
      <footer class="doc-footer">
        <span>${(0,d.Z)(f.legalName)}</span>
        <span>${(0,d.Z)(a.referenceNo)}</span>
        <span>Page ${b} of 2</span>
      </footer>`,l=b.pdfHref?`<a class="btn btn-primary" href="${(0,d.Z)(b.pdfHref)}" download>Download PDF</a>`:"";return`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Internship Appointment Letter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<style>
  :root {
    --ink: #1A1A1A;
    --ink-2: #333333;
    --ink-3: #525252;
    --ink-4: #8A8A8A;
    --rule: #D9D7D2;
    --rule-soft: #ECEAE5;
    --orange: #FF6A2F;
    --sans: "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  }

  * { box-sizing: border-box; }

  html { background: #EDECE8; }

  body {
    margin: 0;
    background: #EDECE8;
    color: var(--ink-2);
    font-family: var(--sans);
    font-size: 10.5pt;
    line-height: 1.62;
    -webkit-font-smoothing: antialiased;
  }

  /* ---------- the sheet ----------
     Height is a shade under A4 so a rounding error in the print engine
     cannot spill a third, blank page. */
  .page {
    position: relative;
    width: 210mm;
    height: 296.6mm;
    margin: 22px auto;
    padding: 15mm 18mm 12mm;
    background: #FFFFFF;
    box-shadow: 0 2px 20px rgba(0,0,0,0.09);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ---------- letterhead ---------- */

  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--ink);
  }

  .letterhead img { display: block; width: 112px; height: auto; }

  .org {
    text-align: right;
    font-size: 8pt;
    line-height: 1.55;
    color: var(--ink-3);
  }
  .org .legal { font-weight: 600; color: var(--ink); font-size: 8.8pt; }

  /* ---------- meta ---------- */

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 9px;
    font-size: 8.5pt;
    color: var(--ink-4);
  }

  /* ---------- title ---------- */

  .doc-title {
    margin: 20px 0 0;
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--ink);
    text-align: center;
  }
  .doc-rule {
    width: 48px;
    height: 2px;
    background: var(--orange);
    margin: 9px auto 0;
  }

  /* ---------- addressee ---------- */

  .addressee {
    margin-top: 20px;
    font-size: 10pt;
    line-height: 1.5;
  }
  .addressee .name { font-weight: 600; color: var(--ink); font-size: 10.5pt; }
  .addressee .email { color: var(--ink-3); }

  /* ---------- particulars ---------- */

  table.particulars {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0 0;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  table.particulars th,
  table.particulars td {
    text-align: left;
    vertical-align: top;
    padding: 6.5px 0;
    font-size: 9.5pt;
    line-height: 1.45;
    border-bottom: 1px solid var(--rule-soft);
  }
  table.particulars tr:last-child th,
  table.particulars tr:last-child td { border-bottom: none; }
  table.particulars th {
    width: 38%;
    font-weight: 400;
    color: var(--ink-4);
    padding-right: 16px;
  }
  table.particulars td { font-weight: 600; color: var(--ink); }

  /* ---------- body ---------- */

  .body { margin-top: 18px; }
  .body p { margin: 0 0 11px; text-align: justify; }
  .body p:last-child { margin-bottom: 0; }
  .salutation { margin-bottom: 12px !important; }

  h2.clause {
    margin: 18px 0 7px;
    font-size: 10pt;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: 0.01em;
  }

  ol.terms { margin: 0; padding-left: 17px; }
  ol.terms li { margin-bottom: 8px; padding-left: 3px; text-align: justify; }
  ol.terms li:last-child { margin-bottom: 0; }

  /* ---------- page 2 continuation strip ---------- */

  .continued {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 9px;
    border-bottom: 1px solid var(--rule);
    font-size: 8.5pt;
    color: var(--ink-4);
  }
  .continued strong { font-weight: 600; color: var(--ink-3); }

  /* ---------- signature ---------- */

  .signature { margin-top: 38px; }

  .sign-grid {
    display: flex;
    justify-content: space-between;
    gap: 40px;
    margin-top: 32px;
  }

  .sign-block { width: 46%; }

  .sign-line {
    border-bottom: 1px solid var(--ink);
    height: 54px;
  }

  .sign-who {
    margin-top: 7px;
    font-size: 9.5pt;
    font-weight: 600;
    color: var(--ink);
  }
  .sign-role {
    font-size: 8.5pt;
    color: var(--ink-4);
    line-height: 1.5;
  }

  .ack {
    margin-top: auto;
    padding-bottom: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--rule-soft);
    font-size: 8.5pt;
    line-height: 1.6;
    color: var(--ink-3);
  }

  /* The note has already absorbed the free space; the footer just follows it. */
  .ack + .doc-footer { margin-top: 14px; }

  /* ---------- footer ---------- */

  .doc-footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--rule-soft);
    display: flex;
    justify-content: space-between;
    gap: 20px;
    font-size: 7.5pt;
    color: var(--ink-4);
  }

  /* ---------- print ----------
     No @page margin: each .page owns its own padding, so the printed
     geometry is the same geometry the screen already showed. */

  @page { size: A4; margin: 0; }

  @media print {
    html, body { background: #FFFFFF; }
    .page {
      margin: 0;
      box-shadow: none;
      break-after: page;
      page-break-after: always;
    }
    .page:last-of-type {
      break-after: auto;
      page-break-after: auto;
    }
    .no-print { display: none !important; }
    a { color: inherit; text-decoration: none; }
  }

  /* ---------- screen-only toolbar ---------- */

  .toolbar {
    width: 210mm;
    margin: 22px auto -6px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }
  .toolbar .hint {
    margin-right: auto;
    font-size: 11.5px;
    color: #6F6C66;
  }
  .btn {
    display: inline-block;
    font-family: var(--sans);
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1;
    border: 1px solid var(--ink);
    border-radius: 7px;
    padding: 10px 18px;
    cursor: pointer;
    text-decoration: none;
  }
  .btn-primary { color: #FFFFFF; background: var(--ink); }
  .btn-primary:hover { background: #000000; }
  .btn-ghost { color: var(--ink); background: transparent; }
  .btn-ghost:hover { background: #FFFFFF; }
  .btn:focus-visible { outline: 2px solid var(--orange); outline-offset: 2px; }

  /* Small screens get a readable reflow. Print geometry is unaffected. */
  @media screen and (max-width: 840px) {
    .page { width: auto; height: auto; margin: 12px; padding: 22px; }
    .toolbar { width: auto; margin: 12px; flex-wrap: wrap; }
    .letterhead { flex-direction: column; gap: 14px; }
    .org { text-align: left; }
    .sign-grid { flex-direction: column; gap: 26px; }
    .sign-block { width: 100%; }
  }
</style>
</head>
<body>

<div class="toolbar no-print">
  <span class="hint">A4, two pages. Print at 100% scale with background graphics on.</span>
  ${l}
  <button type="button" class="btn ${b.pdfHref?"btn-ghost":"btn-primary"}" onclick="window.print()">Print or save as PDF</button>
</div>

<!-- ============================ PAGE 1 ============================ -->
<section class="page">

  <header class="letterhead">
    <img src="${e.W6}/emailogo.png" alt="GrowQR" width="112">
    <div class="org">
      <div class="legal">${(0,d.Z)(f.legalName)}</div>
      <div>${(0,d.Z)(f.address.line1)}</div>
      <div>${(0,d.Z)(f.address.line2)}</div>
      <div>${(0,d.Z)(f.address.line3)}</div>
      <div>${(0,d.Z)(f.site)}</div>
    </div>
  </header>

  <div class="meta">
    <span>Ref: ${(0,d.Z)(a.referenceNo)}</span>
    <span>Date: ${(0,d.Z)(a.date)}</span>
  </div>

  <h1 class="doc-title">Internship Appointment Letter</h1>
  <div class="doc-rule"></div>

  <div class="addressee">
    <div class="name">${(0,d.Z)(a.internName)}</div>
    <div class="email">${(0,d.Z)(a.internEmail)}</div>
  </div>

  <table class="particulars">
    <tbody>
${g("Designation",a.designation)}
${g("Department",a.department)}
${g("Start date",a.startDate)}
${g("End date",a.endDate)}
${g("Duration",a.duration)}
${g("Reporting manager",a.reportingManager)}
${g("Work location",a.location)}
    </tbody>
  </table>

  <div class="body">
    <p class="salutation">Dear ${j},</p>

    <p>
      Further to your application and the selection process, we are pleased to confirm your
      appointment as <strong>${(0,d.Z)(a.designation)}</strong> with ${(0,d.Z)(f.legalName)}.
      Your internship begins on ${(0,d.Z)(a.startDate)} and runs for ${(0,d.Z)(a.duration)},
      concluding on ${(0,d.Z)(a.endDate)}.
    </p>

    <p>
      You will be part of the ${(0,d.Z)(a.department)} team, reporting to
      ${(0,d.Z)(a.reportingManager)}, and will be based at ${(0,d.Z)(a.location)}.
    </p>

    <h2 class="clause">Terms of engagement</h2>
    <ol class="terms">
      <li>
        You are expected to conduct yourself professionally at all times and to comply with the
        policies, standards and codes of conduct of ${(0,d.Z)(f.tradingName)} as they apply
        from time to time.
      </li>
      <li>
        You will treat as strictly confidential all information relating to the Company, its clients,
        its users and its business that you access during the internship, and will not disclose or
        use it for any purpose outside your assigned work, during the internship or after it ends.
      </li>
      <li>
        Any work product, material or intellectual property you create in the course of the
        internship, and in connection with it, belongs to the Company.
      </li>
    </ol>
  </div>
${k(1)}
</section>

<!-- ============================ PAGE 2 ============================ -->
<section class="page">

  <div class="continued">
    <span><strong>Internship Appointment Letter</strong> &nbsp;\xb7&nbsp; ${(0,d.Z)(a.internName)}</span>
    <span>Ref: ${(0,d.Z)(a.referenceNo)}</span>
  </div>

  <div class="body">
    <ol class="terms" start="4">
      <li>
        You will carry out the responsibilities assigned to you diligently, keep to agreed timelines,
        and maintain regular communication with your reporting manager.
      </li>
      <li>
        You will handle Company equipment, systems, accounts and data responsibly, and use them only
        for Company work.
      </li>
      <li>
        This internship is a fixed-term learning engagement for the period stated above. Either party
        may end it earlier with reasonable written notice.
      </li>
      <li>
        This appointment is subject to the Company's policies and terms, and to your continued
        adherence to them.
      </li>
    </ol>

    <p style="margin-top:16px;">
      We are glad to have you with us and look forward to the contribution you will make. Please
      sign and return a copy of this letter to confirm your acceptance.
    </p>
  </div>

  <div class="signature">
    <p style="margin:0 0 6px;">Yours sincerely,</p>
    <div class="sign-who">${(0,d.Z)(c)}</div>
    <div class="sign-role">
      ${(0,d.Z)(i)}<br>
      ${(0,d.Z)(f.legalName)}
    </div>

    <div class="sign-grid" style="justify-content:flex-start;">
      <div class="sign-block">
        <div class="sign-line"></div>
        <div class="sign-who">${(0,d.Z)(a.internName)}</div>
        <div class="sign-role">
          Accepted by the intern<br>
          Date: ____________________
        </div>
      </div>
    </div>

  </div>

  <p class="ack">
      This letter is issued electronically by ${(0,d.Z)(f.legalName)} and is valid without a
      seal. For any query, write to ${(0,d.Z)(f.email)} quoting reference
      ${(0,d.Z)(a.referenceNo)}.
  </p>
${k(2)}
</section>

</body>
</html>`}},44695:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.d(b,{e:()=>l});var e=c(75338);c(74515);var f=c(78591),g=c(43542),h=a([f]);f=(h.then?(await h)():h)[0];let m="#1A1A1A",n="#525252",o="#8A8A8A",p="#D9D7D2",q="#ECEAE5",r=f.StyleSheet.create({page:{fontFamily:"Helvetica",color:"#333333",fontSize:10,lineHeight:1.5,paddingHorizontal:51,paddingTop:43,paddingBottom:34},letterhead:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:10,borderBottomWidth:2,borderBottomColor:m},logo:{width:96,height:48,objectFit:"contain"},org:{textAlign:"right",fontSize:7.5,color:n,lineHeight:1.5},orgLegal:{fontFamily:"Helvetica-Bold",color:m,fontSize:8.2},meta:{flexDirection:"row",justifyContent:"space-between",marginTop:8,fontSize:8,color:o},title:{marginTop:18,fontSize:13,fontFamily:"Helvetica-Bold",letterSpacing:.5,textTransform:"uppercase",color:m,textAlign:"center"},titleRule:{width:44,height:2,backgroundColor:"#FF6A2F",alignSelf:"center",marginTop:8},addressee:{marginTop:18},addresseeName:{fontFamily:"Helvetica-Bold",color:m,fontSize:10.5},addresseeEmail:{color:n,fontSize:9.5},particulars:{marginTop:14,borderTopWidth:1,borderTopColor:p,borderBottomWidth:1,borderBottomColor:p},pRow:{flexDirection:"row",paddingVertical:5,borderBottomWidth:1,borderBottomColor:q},pRowLast:{borderBottomWidth:0},pLabel:{width:"38%",color:o,fontSize:9.5,paddingRight:14},pValue:{flex:1,color:m,fontFamily:"Helvetica-Bold",fontSize:9.5},body:{marginTop:16},para:{marginBottom:10,textAlign:"justify"},salutation:{marginBottom:11},bold:{fontFamily:"Helvetica-Bold",color:m},clauseHeading:{marginTop:16,marginBottom:7,fontSize:10,fontFamily:"Helvetica-Bold",color:m},clause:{flexDirection:"row",marginBottom:7},clauseNum:{width:16,fontFamily:"Helvetica-Bold",color:m},clauseText:{flex:1,textAlign:"justify"},continued:{flexDirection:"row",justifyContent:"space-between",paddingBottom:8,borderBottomWidth:1,borderBottomColor:p,fontSize:8,color:o},continuedStrong:{fontFamily:"Helvetica-Bold",color:n},signature:{marginTop:30},signGrid:{flexDirection:"row",justifyContent:"space-between",marginTop:28},signBlock:{width:"46%"},signLine:{borderBottomWidth:1,borderBottomColor:m,height:46},signWho:{marginTop:6,fontSize:9.5,fontFamily:"Helvetica-Bold",color:m},signRole:{fontSize:8.5,color:o,lineHeight:1.5},ack:{marginTop:24,paddingTop:11,borderTopWidth:1,borderTopColor:q,fontSize:8.5,color:n,lineHeight:1.5},footer:{position:"absolute",bottom:22,left:51,right:51,flexDirection:"row",justifyContent:"space-between",paddingTop:10,borderTopWidth:1,borderTopColor:q,fontSize:7.5,color:o}});function i({label:a,value:b,last:c}){return(0,e.jsxs)(f.View,{style:c?[r.pRow,r.pRowLast]:r.pRow,children:[(0,e.jsx)(f.Text,{style:r.pLabel,children:a}),(0,e.jsx)(f.Text,{style:r.pValue,children:b})]})}function j({n:a,text:b}){return(0,e.jsxs)(f.View,{style:r.clause,children:[(0,e.jsxs)(f.Text,{style:r.clauseNum,children:[a,"."]}),(0,e.jsx)(f.Text,{style:r.clauseText,children:b})]})}function k({page:a,referenceNo:b}){return(0,e.jsxs)(f.View,{style:r.footer,fixed:!0,children:[(0,e.jsx)(f.Text,{children:g.Kq.legalName}),(0,e.jsx)(f.Text,{children:b}),(0,e.jsxs)(f.Text,{children:["Page ",a," of 2"]})]})}function l({params:a,logoSrc:b}){let c=a.internName.trim().split(/\s+/)[0]??"",d=a.signatoryName??"Authorised Signatory",h=a.signatoryTitle??`For ${g.Kq.legalName}`;return(0,e.jsxs)(f.Document,{title:"Internship Appointment Letter",author:g.Kq.legalName,children:[(0,e.jsxs)(f.Page,{size:"A4",style:r.page,children:[(0,e.jsxs)(f.View,{style:r.letterhead,children:[b?(0,e.jsx)(f.Image,{src:b,style:r.logo}):(0,e.jsx)(f.Text,{style:r.orgLegal,children:g.Kq.tradingName}),(0,e.jsxs)(f.View,{style:r.org,children:[(0,e.jsx)(f.Text,{style:r.orgLegal,children:g.Kq.legalName}),(0,e.jsx)(f.Text,{children:g.Kq.address.line1}),(0,e.jsx)(f.Text,{children:g.Kq.address.line2}),(0,e.jsx)(f.Text,{children:g.Kq.address.line3}),(0,e.jsx)(f.Text,{children:g.Kq.site})]})]}),(0,e.jsxs)(f.View,{style:r.meta,children:[(0,e.jsxs)(f.Text,{children:["Ref: ",a.referenceNo]}),(0,e.jsxs)(f.Text,{children:["Date: ",a.date]})]}),(0,e.jsx)(f.Text,{style:r.title,children:"Internship Appointment Letter"}),(0,e.jsx)(f.View,{style:r.titleRule}),(0,e.jsxs)(f.View,{style:r.addressee,children:[(0,e.jsx)(f.Text,{style:r.addresseeName,children:a.internName}),(0,e.jsx)(f.Text,{style:r.addresseeEmail,children:a.internEmail})]}),(0,e.jsxs)(f.View,{style:r.particulars,children:[(0,e.jsx)(i,{label:"Designation",value:a.designation}),(0,e.jsx)(i,{label:"Department",value:a.department}),(0,e.jsx)(i,{label:"Start date",value:a.startDate}),(0,e.jsx)(i,{label:"End date",value:a.endDate}),(0,e.jsx)(i,{label:"Duration",value:a.duration}),(0,e.jsx)(i,{label:"Reporting manager",value:a.reportingManager}),(0,e.jsx)(i,{label:"Work location",value:a.location,last:!0})]}),(0,e.jsxs)(f.View,{style:r.body,children:[(0,e.jsxs)(f.Text,{style:[r.para,r.salutation],children:["Dear ",c,","]}),(0,e.jsxs)(f.Text,{style:r.para,children:["Further to your application and the selection process, we are pleased to confirm your appointment as ",(0,e.jsx)(f.Text,{style:r.bold,children:a.designation})," with ",g.Kq.legalName,". Your internship begins on ",a.startDate," and runs for ",a.duration,", concluding on"," ",a.endDate,"."]}),(0,e.jsxs)(f.Text,{style:r.para,children:["You will be part of the ",a.department," team, reporting to ",a.reportingManager,", and will be based at ",a.location,"."]}),(0,e.jsx)(f.Text,{style:r.clauseHeading,children:"Terms of engagement"}),(0,e.jsx)(j,{n:1,text:"You are expected to conduct yourself professionally at all times and to comply with the policies, standards and codes of conduct of GrowQR as they apply from time to time."}),(0,e.jsx)(j,{n:2,text:"You will treat as strictly confidential all information relating to the Company, its clients, its users and its business that you access during the internship, and will not disclose or use it for any purpose outside your assigned work, during the internship or after it ends."}),(0,e.jsx)(j,{n:3,text:"Any work product, material or intellectual property you create in the course of the internship, and in connection with it, belongs to the Company."})]}),(0,e.jsx)(k,{page:1,referenceNo:a.referenceNo})]}),(0,e.jsxs)(f.Page,{size:"A4",style:r.page,children:[(0,e.jsxs)(f.View,{style:r.continued,children:[(0,e.jsxs)(f.Text,{children:[(0,e.jsx)(f.Text,{style:r.continuedStrong,children:"Internship Appointment Letter"})," \xb7 ",a.internName]}),(0,e.jsxs)(f.Text,{children:["Ref: ",a.referenceNo]})]}),(0,e.jsxs)(f.View,{style:r.body,children:[(0,e.jsx)(j,{n:4,text:"You will carry out the responsibilities assigned to you diligently, keep to agreed timelines, and maintain regular communication with your reporting manager."}),(0,e.jsx)(j,{n:5,text:"You will handle Company equipment, systems, accounts and data responsibly, and use them only for Company work."}),(0,e.jsx)(j,{n:6,text:"This internship is a fixed-term learning engagement for the period stated above. Either party may end it earlier with reasonable written notice."}),(0,e.jsx)(j,{n:7,text:"This appointment is subject to the Company's policies and terms, and to your continued adherence to them."}),(0,e.jsx)(f.Text,{style:[r.para,{marginTop:14}],children:"We are glad to have you with us and look forward to the contribution you will make. Please sign and return a copy of this letter to confirm your acceptance."})]}),(0,e.jsxs)(f.View,{style:r.signature,children:[(0,e.jsx)(f.Text,{children:"Yours sincerely,"}),(0,e.jsx)(f.Text,{style:[r.signWho,{marginTop:6}],children:d}),(0,e.jsx)(f.Text,{style:r.signRole,children:h}),(0,e.jsx)(f.Text,{style:r.signRole,children:g.Kq.legalName}),(0,e.jsx)(f.View,{style:[r.signGrid,{justifyContent:"flex-start"}],children:(0,e.jsxs)(f.View,{style:r.signBlock,children:[(0,e.jsx)(f.View,{style:r.signLine}),(0,e.jsx)(f.Text,{style:r.signWho,children:a.internName}),(0,e.jsx)(f.Text,{style:r.signRole,children:"Accepted by the intern"}),(0,e.jsx)(f.Text,{style:r.signRole,children:"Date: ____________________"})]})})]}),(0,e.jsxs)(f.Text,{style:r.ack,children:["This letter is issued electronically by ",g.Kq.legalName," and is valid without a seal. For any query, write to ",g.Kq.email," quoting reference ",a.referenceNo,"."]}),(0,e.jsx)(k,{page:2,referenceNo:a.referenceNo})]})]})}d()}catch(a){d(a)}})},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{a.exports=require("crypto")},57600:(a,b,c)=>{c.d(b,{Hh:()=>h,Jm:()=>l,W3:()=>g,W6:()=>d,Xt:()=>m,gW:()=>k,rf:()=>f});let d="https://www.growqr.ai",e=`${d}/#organization`;function f(a){return`${d}${a.startsWith("/")?a:`/${a}`}`}function g(a){return f(a)}let h={url:"/og-image.png",width:1200,height:630,alt:"GrowQR — One QR. One Identity. Unlocks Growth."},i={"Asia/Kolkata":"+05:30",UTC:"+00:00"};function j(a,b,c){let d=function(a){if(!a)return null;let b=a.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);if(!b)return null;let c=parseInt(b[1],10),d=b[2],e=b[3]?.toUpperCase();return("PM"===e&&c<12&&(c+=12),"AM"===e&&12===c&&(c=0),c>23)?null:`${String(c).padStart(2,"0")}:${d}:00`}(b)??"00:00:00",e=c?i[c]:void 0;return`${a}T${d}${e??""}`}function k(a){let b=f(`/events/${a.slug}`),c="online"===a.event_mode,d=c?{"@type":"VirtualLocation",url:a.meeting_url??b}:{"@type":"Place",name:a.venue??a.title,address:{"@type":"PostalAddress",...a.city?{addressLocality:a.city}:{},...a.country?{addressCountry:a.country}:{}}},g=a.poster_url??a.speaker_image??f("/logo.png");return{"@context":"https://schema.org","@type":"Event",name:a.title,...a.short_description?{description:a.short_description}:{},startDate:j(a.event_date,a.start_time,a.timezone),...a.end_time?{endDate:j(a.event_date,a.end_time,a.timezone)}:{},eventAttendanceMode:c?"https://schema.org/OnlineEventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",eventStatus:"https://schema.org/EventScheduled",location:d,image:g,url:b,organizer:{"@id":e},...a.speaker_name?{performer:{"@type":"Person",name:a.speaker_name}}:{}}}function l(a){let b=f(`/experts/${a.slug}`),c=a.reviewCount>0&&a.reviews.length>0;return{"@context":"https://schema.org","@type":"Person",name:a.name,jobTitle:a.role,description:a.bio,image:a.image,url:b,...c?{aggregateRating:{"@type":"AggregateRating",ratingValue:a.rating,reviewCount:a.reviewCount},review:a.reviews.map(a=>({"@type":"Review",author:{"@type":"Person",name:a.name},reviewRating:{"@type":"Rating",ratingValue:a.rating,bestRating:5},reviewBody:a.text}))}:{}}}function m(a){return{"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:a.map((a,b)=>({"@type":"ListItem",position:b+1,name:a.name,item:f(a.path)}))}}},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{a.exports=require("node:fs")},75338:(a,b,c)=>{a.exports=c(49754).vendored["react-rsc"].ReactJsxRuntime},76760:a=>{a.exports=require("node:path")},76791:(a,b,c)=>{c.a(a,async(a,d)=>{try{c.r(b),c.d(b,{handler:()=>y,patchFetch:()=>x,routeModule:()=>z,serverHooks:()=>C,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>B});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(34679),u=c(51356),v=c(33112),w=a([v]);v=(w.then?(await w)():w)[0];let z=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/admin/internship-appointment/route",pathname:"/api/admin/internship-appointment",filename:"route",bundlePath:"app/api/admin/internship-appointment/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/runner/work/growqr.ai-final/growqr.ai-final/app/api/admin/internship-appointment/route.ts",nextConfigOutput:"standalone",userland:v}),{workAsyncStorage:A,workUnitAsyncStorage:B,serverHooks:C}=z;function x(){return(0,g.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:B})}async function y(a,b,c){var d;let e="/api/admin/internship-appointment/route";"/index"===e&&(e="/");let g=await z.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,params:w,nextConfig:x,isDraftMode:y,prerenderManifest:A,routerServerContext:B,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,resolvedPathname:E}=g,F=(0,j.normalizeAppPath)(e),G=!!A.routes[E]&&(z.isDev||(0,t.isRouteCacheOwner)(E,z.cacheOwner,A.routes[E])),H=!!(A.dynamicRoutes[F]||G);if(H&&!y){let a=A.dynamicRoutes[F];if(a&&!1===a.fallback&&!G)throw new s.NoFallbackError}let I=null;!H||z.isDev||y||(I=E,I="/index"===I?"/":I);let J=!0===z.isDev||!H,K=H&&!J,L=a.method||"GET",M=(0,i.getTracer)(),N=M.getActiveScopeSpan(),O={params:w,prerenderManifest:A,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:J,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:K,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>z.onRequestError(a,b,d,B)},sharedContext:{buildId:v}},P=new k.NodeNextRequest(a),Q=new k.NodeNextResponse(b),R=l.NextRequestAdapter.fromNodeNextRequest(P,(0,l.signalFromNodeResponse)(b));try{let d=async c=>z.handle(R,O).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=M.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${L} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${L} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&C&&D&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=O.renderOpts.fetchMetrics;let i=O.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=O.renderOpts.collectedTags;if(!H)return await (0,o.I)(P,Q,e,O.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==O.renderOpts.collectedRevalidate&&!(O.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&O.renderOpts.collectedRevalidate,d=void 0===O.renderOpts.collectedExpire||O.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:O.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await z.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:C})},B),b}},l=await z.handleResponse({req:a,nextConfig:x,cacheKey:I,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:D,responseGenerator:k,waitUntil:c.waitUntil});if(!H)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",C?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&H||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(P,Q,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};N?await g(N):await M.withPropagatedContext(a.headers,()=>M.trace(m.BaseServerSpan.handleRequest,{spanName:`${L} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await z.onRequestError(a,b,{routerKind:"App Router",routePath:F,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:C})}),H)throw b;return await (0,o.I)(P,Q,new Response(null,{status:500})),null}}d()}catch(a){d(a)}})},77598:a=>{a.exports=require("node:crypto")},78591:a=>{a.exports=import("@react-pdf/renderer")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},86642:(a,b,c)=>{c.d(b,{Z:()=>d});function d(a){return null==a?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4887,4421,641,2080,1479,2137,9993],()=>b(b.s=76791));module.exports=c})();