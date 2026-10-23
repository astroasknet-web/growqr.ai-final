"use strict";(()=>{var a={};a.id=5915,a.ids=[5915],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},3498:a=>{a.exports=require("mysql2/promise")},8715:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>N,patchFetch:()=>M,routeModule:()=>I,serverHooks:()=>L,workAsyncStorage:()=>J,workUnitAsyncStorage:()=>K});var d={};c.r(d),c.d(d,{POST:()=>H});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(34679),u=c(51356),v=c(10641),w=c(64899),x=c(5744),y=c(19655),z=c(86642),A=c(7230),B=c(22191),C=c(72709),D=c(30366),E=c(57600);let F="GrowQR | Support <hello@growqr.ai>",G=(0,B.h)("send-contact"),H=(0,C.m)({key:"send-contact",turnstile:{label:"Contact",errorMessage:"Security check failed. Please try again."},parse:D.Gq,persist:async(a,b)=>{let c=(0,w.Zf)(),{data:d,error:e}=await c.from("contact_messages").insert({name:a.name,email:a.email,subject:a.subject,message:a.message,type:a.type,country_code:b.countryCode,...b.attribution,crm_sync_status:"general"===a.type?"skipped":"pending"}).select("id").single();return e?(G.error("insert error:",e),v.NextResponse.json({error:"Could not save your message. Please try again."},{status:500})):{crmRowId:d.id}},crmSource:"contact_messages",sideEffects:function(a){let b=(0,z.Z)(a.name),c=(0,z.Z)(a.subject),d=a.subject.replace(/[\r\n]+/g," ").trim(),e=(0,A.Qt)();return[e.emails.send({from:F,to:"support@growqr.ai",subject:`New Contact Form: ${d}`,html:function(a){let{inquiryType:b,name:c,email:d,subjectLine:e,formattedMessage:f}=a;return(0,x.P)(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td class="surface">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="hero mobile-pad" style="padding: 28px;">
                      <div style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;">GrowQR Contact</div>
                      <h1 class="hero-title" style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.2;">New contact form submission</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="mobile-pad" style="padding: 28px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding-bottom: 14px;"><span class="chip">${b}</span></td>
                        </tr>
                      </table>

                      <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 18px;">
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Name:</strong> ${c}</p>
                            <p class="text-muted body-text" style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Email:</strong> <a href="mailto:${d}" style="color: #ff6b35; text-decoration: none;">${d}</a></p>
                            <p class="text-muted body-text" style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Subject:</strong> ${e}</p>
                            <div class="divider" style="height: 1px; margin: 0 0 14px 0;"></div>
                            <p class="text-primary body-text" style="margin: 0 0 8px 0; font-size: 14px; line-height: 1.6; font-weight: 700;">Message</p>
                            <p class="text-muted body-text" style="margin: 0; font-size: 14px; line-height: 1.7;">${f}</p>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                        <tr>
                          <td align="left">
                            <a class="cta" href="mailto:${d}?subject=Re:%20${encodeURIComponent(e)}">Reply to ${c}</a>
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
                <p class="text-muted" style="margin: 0; font-size: 12px;">This notification was generated from the GrowQR contact form.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)}({inquiryType:"sales"===a.type?"Sales Enquiry":"General Enquiry",name:b,email:(0,z.Z)(a.email),subjectLine:c,formattedMessage:(0,z.Z)(a.message).replace(/\n/g,"<br>")})}),e.emails.send({from:F,to:a.email,subject:"We received your message - GrowQR",html:function(a){let{name:b,subjectLine:c}=a;return(0,x.P)(`
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td class="outer-pad" align="center" style="padding: 24px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding: 6px 0 16px 0;">
                ${(0,y.O)({width:140,align:"center"})}
              </td>
            </tr>
            <tr>
              <td class="surface mobile-pad" style="padding: 28px;">
                <h1 class="text-primary hero-title" style="margin: 0 0 12px 0; font-size: 28px; line-height: 1.2;">Thanks for reaching out, ${b}.</h1>
                <p class="text-muted body-text" style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.7;">
                  We received your message and our team will respond shortly.
                </p>

                <table role="presentation" class="card" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 18px;">
                  <tr>
                    <td style="padding: 16px;">
                      <p class="text-primary" style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;">Message summary</p>
                      <p class="text-muted body-text" style="margin: 0; font-size: 14px; line-height: 1.6;"><strong class="text-primary">Subject:</strong> ${c}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left">
                      <a class="cta" href="${E.W6}">Visit GrowQR</a>
                    </td>
                  </tr>
                </table>

                <div class="divider" style="margin: 20px 0 0 0; padding-top: 16px;">
                  <p class="text-muted" style="margin: 0; font-size: 12px; line-height: 1.6;">
                    GrowQR Support Team<br />
                    support@growqr.ai
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `)}({name:b,subjectLine:c})})]},successBody:{success:!0,message:"Emails sent successfully"},failureMessage:"Failed to send email"}),I=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/send-contact/route",pathname:"/api/send-contact",filename:"route",bundlePath:"app/api/send-contact/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"/home/runner/work/growqr.ai-final/growqr.ai-final/app/api/send-contact/route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:J,workUnitAsyncStorage:K,serverHooks:L}=I;function M(){return(0,g.patchFetch)({workAsyncStorage:J,workUnitAsyncStorage:K})}async function N(a,b,c){var d;let e="/api/send-contact/route";"/index"===e&&(e="/");let g=await I.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:v,params:w,nextConfig:x,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!z.routes[D]&&(I.isDev||(0,t.isRouteCacheOwner)(D,I.cacheOwner,z.routes[D])),G=!!(z.dynamicRoutes[E]||F);if(G&&!y){let a=z.dynamicRoutes[E];if(a&&!1===a.fallback&&!F)throw new s.NoFallbackError}let H=null;!G||I.isDev||y||(H="/index"===(H=D)?"/":H);let J=!0===I.isDev||!G,K=G&&!J,L=a.method||"GET",M=(0,i.getTracer)(),N=M.getActiveScopeSpan(),O={params:w,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!x.experimental.cacheComponents,authInterrupts:!!x.experimental.authInterrupts},supportsDynamicResponse:J,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=x.experimental)?void 0:d.cacheLife,isRevalidate:K,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>I.onRequestError(a,b,d,A)},sharedContext:{buildId:v}},P=new k.NodeNextRequest(a),Q=new k.NodeNextResponse(b),R=l.NextRequestAdapter.fromNodeNextRequest(P,(0,l.signalFromNodeResponse)(b));try{let d=async c=>I.handle(R,O).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=M.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${L} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${L} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=O.renderOpts.fetchMetrics;let i=O.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=O.renderOpts.collectedTags;if(!G)return await (0,o.I)(P,Q,e,O.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==O.renderOpts.collectedRevalidate&&!(O.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&O.renderOpts.collectedRevalidate,d=void 0===O.renderOpts.collectedExpire||O.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:O.renderOpts.collectedExpire;return{value:{kind:u.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await I.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})},A),b}},l=await I.handleResponse({req:a,nextConfig:x,cacheKey:H,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!G)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==u.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&G||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(P,Q,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};N?await g(N):await M.withPropagatedContext(a.headers,()=>M.trace(m.BaseServerSpan.handleRequest,{spanName:`${L} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":L,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await I.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:K,isOnDemandRevalidate:B})}),G)throw b;return await (0,o.I)(P,Q,new Response(null,{status:500})),null}}},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{a.exports=require("path")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{a.exports=require("crypto")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:a=>{a.exports=require("node:fs")},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[4887,641,4885,7195,2080,1479,6438,5562],()=>b(b.s=8715));module.exports=c})();