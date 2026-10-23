"use strict";(()=>{var a={};a.id=8251,a.ids=[8251],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3498:a=>{a.exports=require("mysql2/promise")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{a.exports=require("path")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{a.exports=require("crypto")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},68239:(a,b,c)=>{c.d(b,{u:()=>e});let d=new Set(["dr","mr","mrs","ms","miss","mx","prof","professor","ca","cs","cma","adv","advocate","er","sir","madam","shri","smt"]);function e(a,b="there"){if(!a)return b;for(let b of a.trim().split(/\s+/)){let a=b.replace(/[().,'"]/g,"");if(a&&!d.has(a.toLowerCase()))return b.replace(/^[("']+|[).,"']+$/g,"")}return b}},73024:a=>{a.exports=require("node:fs")},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},92758:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>O,patchFetch:()=>N,routeModule:()=>J,serverHooks:()=>M,workAsyncStorage:()=>K,workUnitAsyncStorage:()=>L});var d={};c.r(d),c.d(d,{POST:()=>I});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(34679),u=c(51356),v=c(10641),w=c(64899),x=c(7230),y=c(86642),z=c(68239),A=c(5744),B=c(19655),C=c(22191),D=c(72709),E=c(30366);let F="GrowQR | B2B <hello@growqr.ai>",G="support@growqr.ai",H=(0,C.h)("b2b-lead"),I=(0,D.m)({key:"b2b-lead",turnstile:{label:"B2B lead",errorMessage:"Security check failed. Please try again."},parse:E.Qt,persist:async(a,b)=>{let c=(0,w.Zf)(),{data:d,error:e}=await c.from("b2b_leads").insert({name:a.name,email:a.email,company:a.company,team_size:a.teamSize,message:a.message,agent:a.agent,solution:a.solution,country_code:b.countryCode,...b.attribution,page_path:a.source}).select("id").single();return e?(H.error("insert error:",e),v.NextResponse.json({error:"Could not save your enquiry. Please try again."},{status:500})):{crmRowId:d.id}},crmSource:"b2b_leads",sideEffects:function(a){let b=a.agent??a.solution??"General enquiry",c=(0,x.Qt)();return[c.emails.send({from:F,to:G,replyTo:a.email,subject:`New B2B lead: ${a.company}`,html:function(a){let{name:b,email:c,company:d,teamSize:e,agent:f,solution:g,page:h,message:i}=a;return(0,A.P)(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR B2B</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">New enterprise lead</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-bottom: 14px;"><span class="chip">${(0,y.Z)("N/A"!==f?f:"N/A"!==g?g:"General enquiry")}</span></td>
                        </tr>
                      </table>

                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Name:</strong> ${(0,y.Z)(b)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Email:</strong> <a href="mailto:${(0,y.Z)(c)}" style="color: #ff6b35; text-decoration: none;">${(0,y.Z)(c)}</a></p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Company:</strong> ${(0,y.Z)(d)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Team size:</strong> ${(0,y.Z)(e)}</p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Page:</strong> ${(0,y.Z)(h)}</p>
                            <div class="divider" style="height: 1px; margin: 0 0 14px 0;"></div>
                            <p class="text-primary body-text" style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; font-weight: 700;">Message</p>
                            <p class="text-muted body-text" style="margin: 0; font-size: 14px; line-height: 1.7;">${(0,y.Z)(i).replace(/\n/g,"<br>")}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                        <tr>
                          <td align="left">
                            <a class="cta" href="mailto:${(0,y.Z)(c)}?subject=Re:%20GrowQR%20for%20${encodeURIComponent(d)}">Reply to ${(0,y.Z)(b)}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 12px 8px 0 8px;">
                <p class="text-muted" style="margin: 0; font-size: 12px;">This lead was captured from the GrowQR enterprise contact modal.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)}({name:a.name,email:a.email,company:a.company,teamSize:a.teamSize??"N/A",agent:a.agent??"N/A",solution:a.solution??"N/A",page:a.source??"N/A",message:a.message??"N/A"})}),c.emails.send({from:F,to:a.email,replyTo:G,subject:"We received your enquiry - GrowQR Enterprise",html:function(a){let{name:b,company:c,teamSize:d,attribution:e}=a,f=(0,y.Z)((0,z.u)(b)),g="-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',Arial,sans-serif",h=(a,b,c=!1)=>`<tr><td style="padding:13px 18px;${c?"":"border-bottom:1px solid #eef0f2;"}">
       <p style="margin:0 0 2px;font-family:${g};font-size:11px;color:#8b919a;line-height:1;">${a}</p>
       <p style="margin:0;font-family:${g};font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;word-break:break-word;">${b}</p>
     </td></tr>`,i=["A GrowQR team member will review your enquiry","We'll reach out to your email within 1 business day"].map(a=>`<tr><td style="padding:2px 0;font-family:${g};font-size:13px;color:#374151;line-height:1.6;">
           <span style="color:#FF6A2F;">&#8226;</span>&ensp;${a}
         </td></tr>`).join("");return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Enquiry received</title>
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
  We received your enquiry about GrowQR Enterprise for ${(0,y.Z)(c)}.
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-bg" style="background-color:#f4f5f7;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" class="card" style="max-width:540px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">

      <!-- Brand header -->
      <tr>
        <td class="px" style="background-color:#ffffff;padding:24px 36px 16px;">
          ${(0,B.O)({width:120})}
        </td>
      </tr>

      <!-- Accent line -->
      <tr>
        <td class="px" style="padding:0 36px;">
          <div class="accent-line" style="height:2px;background-color:#FF6A2F;border-radius:1px;"></div>
        </td>
      </tr>

      <!-- Heading -->
      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <h1 class="text-dark" style="margin:0 0 4px;font-family:${g};font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:-0.2px;">
            Enquiry received
          </h1>
          <p class="text-mid" style="margin:0;font-family:${g};font-size:13.5px;color:#6b7280;line-height:1.5;">
            Hi ${f}, we've received your enquiry about GrowQR Enterprise.
          </p>
        </td>
      </tr>

      <!-- Details card -->
      <tr>
        <td class="px" style="padding:20px 36px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card-inner" style="background-color:#f7f8f9;border-radius:8px;overflow:hidden;">
            ${h("Company",(0,y.Z)(c))}
            ${h("Team size",(0,y.Z)(d))}
            ${h("Regarding",(0,y.Z)(e),!0)}
          </table>
        </td>
      </tr>

      <!-- Divider -->
      <tr>
        <td class="px" style="padding:22px 36px 0;">
          <div style="height:1px;background-color:#eef0f2;"></div>
        </td>
      </tr>

      <!-- What happens next -->
      <tr>
        <td class="px" style="padding:18px 36px 0;">
          <p class="text-light" style="margin:0 0 8px;font-family:${g};font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.4px;">
            What happens next
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">${i}</table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="px" style="padding:24px 36px 22px;">
          <div style="height:1px;background-color:#eef0f2;margin-bottom:16px;"></div>
          <p class="text-light" style="margin:0;font-family:${g};font-size:11.5px;color:#9ca3af;line-height:1.6;">
            Questions? Contact
            <a href="mailto:support@growqr.ai" style="color:#FF6A2F;text-decoration:none;">support@growqr.ai</a>
          </p>
          <p style="margin:4px 0 0;font-family:${g};font-size:10.5px;color:#c9cdd4;line-height:1;">
            GrowQR Enterprise
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>

</body>
</html>`}({name:a.name,company:a.company,teamSize:a.teamSize??"Not specified",attribution:b})})]},successBody:{success:!0},failureMessage:"Something went wrong. Please try again."}),J=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/b2b-lead/route",pathname:"/api/b2b-lead",filename:"route",bundlePath:"app/api/b2b-lead/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/runner/work/growqr.ai-final/growqr.ai-final/app/api/b2b-lead/route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:K,workUnitAsyncStorage:L,serverHooks:M}=J;function N(){return(0,g.patchFetch)({workAsyncStorage:K,workUnitAsyncStorage:L})}async function O(a,b,c){var d;let e="/api/b2b-lead/route";"/index"===e&&(e="/");let g=await J.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,params:w,nextConfig:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!z.routes[D]&&(J.isDev||(0,t.isRouteCacheOwner)(D,J.cacheOwner,z.routes[D])),G=!!(z.dynamicRoutes[E]||F);if(G&&!y){let a=z.dynamicRoutes[E];if(a&&!1===a.fallback&&!F)throw new s.NoFallbackError}let H=null;!G||J.isDev||y||(H="/index"===(H=D)?"/":H);let I=!0===J.isDev||!G,K=G&&!I,L=a.method||"GET",M=(0,i.getTracer)(),N=M.getActiveScopeSpan(),O={params:w,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:I,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:K,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>J.onRequestError(a,b,d,A)},sharedContext:{buildId:v}},P=new k.NodeNextRequest(a),Q=new k.NodeNextResponse(b),R=l.NextRequestAdapter.fromNodeNextRequest(P,(0,l.signalFromNodeResponse)(b));try{let d=async c=>J.handle(R,O).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=M.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${L} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${L} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=O.renderOpts.fetchMetrics;let i=O.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=O.renderOpts.collectedTags;if(!G)return await (0,o.I)(P,Q,e,O.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==O.renderOpts.collectedRevalidate&&!(O.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&O.renderOpts.collectedRevalidate,d=void 0===O.renderOpts.collectedExpire||O.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:O.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await J.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})},A),b}},l=await J.handleResponse({req:a,nextConfig:x,cacheKey:H,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!G)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&G||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(P,Q,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};N?await g(N):await M.withPropagatedContext(a.headers,()=>M.trace(m.BaseServerSpan.handleRequest,{spanName:`${L} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await J.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})}),G)throw b;return await (0,o.I)(P,Q,new Response(null,{status:500})),null}}}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4887,641,4885,7195,2080,1479,6438,5562],()=>b(b.s=92758));module.exports=c})();