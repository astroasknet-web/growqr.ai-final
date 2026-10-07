import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { COMPANY, type AppointmentLetterParams } from "./appointment-letter";

/**
 * The internship appointment letter as a react-pdf document.
 *
 * lib/internship/appointment-letter.ts is the same letter as browser-printable
 * HTML, used for the on-screen preview. This is the production render: a route
 * turns it into a PDF buffer with renderToBuffer() and mails it, exactly the
 * pattern lib/invoice already uses, because that path runs on Vercel's
 * serverless runtime where a headless browser does not.
 *
 * The two must say the same thing. The wording of the body and the seven terms
 * is copied verbatim from the HTML version, and like it this says NOTHING about
 * stipend, salary or compensation.
 */

const INK = "#1A1A1A";
const INK2 = "#333333";
const INK3 = "#525252";
const INK4 = "#8A8A8A";
const RULE = "#D9D7D2";
const RULE_SOFT = "#ECEAE5";
const ORANGE = "#FF6A2F";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    color: INK2,
    fontSize: 10,
    lineHeight: 1.5,
    paddingHorizontal: 51, // ~18mm
    paddingTop: 43, // ~15mm
    paddingBottom: 34, // ~12mm
  },

  /* letterhead */
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: INK,
  },
  logo: { width: 96, height: 48, objectFit: "contain" },
  org: { textAlign: "right", fontSize: 7.5, color: INK3, lineHeight: 1.5 },
  orgLegal: { fontFamily: "Helvetica-Bold", color: INK, fontSize: 8.2 },

  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 8,
    color: INK4,
  },

  title: {
    marginTop: 18,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: INK,
    textAlign: "center",
  },
  titleRule: {
    width: 44,
    height: 2,
    backgroundColor: ORANGE,
    alignSelf: "center",
    marginTop: 8,
  },

  addressee: { marginTop: 18 },
  addresseeName: { fontFamily: "Helvetica-Bold", color: INK, fontSize: 10.5 },
  addresseeEmail: { color: INK3, fontSize: 9.5 },

  /* particulars */
  particulars: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  pRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: RULE_SOFT,
  },
  pRowLast: { borderBottomWidth: 0 },
  pLabel: { width: "38%", color: INK4, fontSize: 9.5, paddingRight: 14 },
  pValue: { flex: 1, color: INK, fontFamily: "Helvetica-Bold", fontSize: 9.5 },

  body: { marginTop: 16 },
  para: { marginBottom: 10, textAlign: "justify" },
  salutation: { marginBottom: 11 },
  bold: { fontFamily: "Helvetica-Bold", color: INK },

  clauseHeading: {
    marginTop: 16,
    marginBottom: 7,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  clause: { flexDirection: "row", marginBottom: 7 },
  clauseNum: { width: 16, fontFamily: "Helvetica-Bold", color: INK },
  clauseText: { flex: 1, textAlign: "justify" },

  continued: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    fontSize: 8,
    color: INK4,
  },
  continuedStrong: { fontFamily: "Helvetica-Bold", color: INK3 },

  signature: { marginTop: 30 },
  signGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 28 },
  signBlock: { width: "46%" },
  signLine: { borderBottomWidth: 1, borderBottomColor: INK, height: 46 },
  signWho: { marginTop: 6, fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INK },
  signRole: { fontSize: 8.5, color: INK4, lineHeight: 1.5 },

  ack: {
    marginTop: 24,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: RULE_SOFT,
    fontSize: 8.5,
    color: INK3,
    lineHeight: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 51,
    right: 51,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: RULE_SOFT,
    fontSize: 7.5,
    color: INK4,
  },
});

const TERMS: string[] = [
  "You are expected to conduct yourself professionally at all times and to comply with the policies, standards and codes of conduct of GrowQR as they apply from time to time.",
  "You will treat as strictly confidential all information relating to the Company, its clients, its users and its business that you access during the internship, and will not disclose or use it for any purpose outside your assigned work, during the internship or after it ends.",
  "Any work product, material or intellectual property you create in the course of the internship, and in connection with it, belongs to the Company.",
  "You will carry out the responsibilities assigned to you diligently, keep to agreed timelines, and maintain regular communication with your reporting manager.",
  "You will handle Company equipment, systems, accounts and data responsibly, and use them only for Company work.",
  "This internship is a fixed-term learning engagement for the period stated above. Either party may end it earlier with reasonable written notice.",
  "This appointment is subject to the Company's policies and terms, and to your continued adherence to them.",
];

function Particular({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? [s.pRow, s.pRowLast] : s.pRow}>
      <Text style={s.pLabel}>{label}</Text>
      <Text style={s.pValue}>{value}</Text>
    </View>
  );
}

function Clause({ n, text }: { n: number; text: string }) {
  return (
    <View style={s.clause}>
      <Text style={s.clauseNum}>{n}.</Text>
      <Text style={s.clauseText}>{text}</Text>
    </View>
  );
}

function Footer({ page, referenceNo }: { page: number; referenceNo: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{COMPANY.legalName}</Text>
      <Text>{referenceNo}</Text>
      <Text>Page {page} of 2</Text>
    </View>
  );
}

export function AppointmentLetterPDF({
  params,
  logoSrc,
}: {
  params: AppointmentLetterParams;
  /**
   * Data URI (or path) for the wordmark. Optional: if the asset cannot be read
   * at request time, the letterhead falls back to the legal name alone rather
   * than failing to render.
   */
  logoSrc?: string;
}) {
  const p = params;
  const first = p.internName.trim().split(/\s+/)[0] ?? "";
  const signatory = p.signatoryName ?? "Authorised Signatory";
  const signatoryTitle = p.signatoryTitle ?? `For ${COMPANY.legalName}`;

  return (
    <Document title="Internship Appointment Letter" author={COMPANY.legalName}>
      {/* Page 1 */}
      <Page size="A4" style={s.page}>
        <View style={s.letterhead}>
          {logoSrc ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={logoSrc} style={s.logo} />
          ) : (
            <Text style={s.orgLegal}>{COMPANY.tradingName}</Text>
          )}
          <View style={s.org}>
            <Text style={s.orgLegal}>{COMPANY.legalName}</Text>
            <Text>{COMPANY.address.line1}</Text>
            <Text>{COMPANY.address.line2}</Text>
            <Text>{COMPANY.address.line3}</Text>
            <Text>{COMPANY.site}</Text>
          </View>
        </View>

        <View style={s.meta}>
          <Text>Ref: {p.referenceNo}</Text>
          <Text>Date: {p.date}</Text>
        </View>

        <Text style={s.title}>Internship Appointment Letter</Text>
        <View style={s.titleRule} />

        <View style={s.addressee}>
          <Text style={s.addresseeName}>{p.internName}</Text>
          <Text style={s.addresseeEmail}>{p.internEmail}</Text>
        </View>

        <View style={s.particulars}>
          <Particular label="Designation" value={p.designation} />
          <Particular label="Department" value={p.department} />
          <Particular label="Start date" value={p.startDate} />
          <Particular label="End date" value={p.endDate} />
          <Particular label="Duration" value={p.duration} />
          <Particular label="Reporting manager" value={p.reportingManager} />
          <Particular label="Work location" value={p.location} last />
        </View>

        <View style={s.body}>
          <Text style={[s.para, s.salutation]}>Dear {first},</Text>
          <Text style={s.para}>
            Further to your application and the selection process, we are pleased to confirm your
            appointment as <Text style={s.bold}>{p.designation}</Text> with {COMPANY.legalName}.
            Your internship begins on {p.startDate} and runs for {p.duration}, concluding on{" "}
            {p.endDate}.
          </Text>
          <Text style={s.para}>
            You will be part of the {p.department} team, reporting to {p.reportingManager}, and will
            be based at {p.location}.
          </Text>

          <Text style={s.clauseHeading}>Terms of engagement</Text>
          <Clause n={1} text={TERMS[0]} />
          <Clause n={2} text={TERMS[1]} />
          <Clause n={3} text={TERMS[2]} />
        </View>

        <Footer page={1} referenceNo={p.referenceNo} />
      </Page>

      {/* Page 2 */}
      <Page size="A4" style={s.page}>
        <View style={s.continued}>
          <Text>
            <Text style={s.continuedStrong}>Internship Appointment Letter</Text> · {p.internName}
          </Text>
          <Text>Ref: {p.referenceNo}</Text>
        </View>

        <View style={s.body}>
          <Clause n={4} text={TERMS[3]} />
          <Clause n={5} text={TERMS[4]} />
          <Clause n={6} text={TERMS[5]} />
          <Clause n={7} text={TERMS[6]} />

          <Text style={[s.para, { marginTop: 14 }]}>
            We are glad to have you with us and look forward to the contribution you will make.
            Please sign and return a copy of this letter to confirm your acceptance.
          </Text>
        </View>

        <View style={s.signature}>
          <Text>Yours sincerely,</Text>
          <Text style={[s.signWho, { marginTop: 6 }]}>{signatory}</Text>
          <Text style={s.signRole}>{signatoryTitle}</Text>
          <Text style={s.signRole}>{COMPANY.legalName}</Text>

          <View style={[s.signGrid, { justifyContent: "flex-start" }]}>
            <View style={s.signBlock}>
              <View style={s.signLine} />
              <Text style={s.signWho}>{p.internName}</Text>
              <Text style={s.signRole}>Accepted by the intern</Text>
              <Text style={s.signRole}>Date: ____________________</Text>
            </View>
          </View>
        </View>

        <Text style={s.ack}>
          This letter is issued electronically by {COMPANY.legalName} and is valid without a seal.
          For any query, write to {COMPANY.email} quoting reference {p.referenceNo}.
        </Text>

        <Footer page={2} referenceNo={p.referenceNo} />
      </Page>
    </Document>
  );
}
