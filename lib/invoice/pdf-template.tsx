import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const ORANGE  = "#FF6A2F";
const INK     = "#1A1A2E";
const INK2    = "#374151";
const INK3    = "#6B7280";
const INK5    = "#9CA3AF";
const LINE    = "#E5E7EB";
const BG_SOFT = "#F9FAFB";

const s = StyleSheet.create({
  page: {
    fontFamily:      "Helvetica",
    backgroundColor: "#FFFFFF",
    color:           INK,
    padding:         0,
    fontSize:        9.5,
  },

  /* ── Top section ── */
  top: {
    paddingHorizontal: 52,
    paddingTop:        44,
    paddingBottom:     24,
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
  },
  logo: {
    width:     100,
    height:    50,
    objectFit: "contain",
  },
  topRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize:   22,
    fontFamily: "Helvetica-Bold",
    color:      INK,
    marginBottom: 6,
  },
  invoiceNum: {
    fontSize: 9,
    color:    INK3,
  },

  /* ── Orange rule ── */
  rule: {
    marginHorizontal: 52,
    height:           2,
    backgroundColor:  ORANGE,
    marginBottom:     28,
  },

  /* ── Body ── */
  body: {
    paddingHorizontal: 52,
  },

  /* ── Meta row ── */
  meta: {
    flexDirection:  "row",
    marginBottom:   24,
    gap:            40,
  },
  metaCol: {},
  metaLabel: {
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
    color:      INK5,
    textTransform: "uppercase",
    marginBottom:  3,
  },
  metaVal: {
    fontSize: 10,
    color:    INK,
  },
  paidPill: {
    backgroundColor: "#ECFDF5",
    borderRadius:    3,
    paddingHorizontal: 7,
    paddingVertical:   2,
  },
  paidPillText: {
    fontSize:   8.5,
    fontFamily: "Helvetica-Bold",
    color:      "#059669",
  },

  /* ── Parties ── */
  parties: {
    flexDirection:  "row",
    gap:            48,
    marginBottom:   28,
  },
  party: {
    flex: 1,
  },
  partyLabel: {
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
    color:      INK5,
    textTransform: "uppercase",
    marginBottom:  5,
  },
  partyName: {
    fontSize:   11,
    fontFamily: "Helvetica-Bold",
    color:      INK,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color:    INK3,
    lineHeight: 1.6,
  },

  /* ── Line separator ── */
  sep: {
    height:       1,
    backgroundColor: LINE,
    marginBottom: 20,
  },

  /* ── Table ── */
  tHead: {
    flexDirection:     "row",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom:     7,
    marginBottom:      0,
  },
  tHeadText: {
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
    color:      INK2,
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection:     "row",
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    alignItems:        "flex-start",
  },
  cDesc: { flex: 4 },
  cQty:  { flex: 0.8, textAlign: "center" },
  cAmt:  { flex: 1.4, textAlign: "right" },
  itemTitle: {
    fontSize:   10,
    fontFamily: "Helvetica-Bold",
    color:      INK,
    marginBottom: 2,
  },
  itemDetail: {
    fontSize: 8.5,
    color:    INK3,
    lineHeight: 1.5,
  },
  cellText: {
    fontSize:   10,
    color:      INK,
  },

  /* ── Totals ── */
  totals: {
    marginTop:   6,
    alignItems:  "flex-end",
  },
  totalLine: {
    flexDirection:  "row",
    gap:            32,
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 9,
    color:    INK3,
    width:    100,
    textAlign: "right",
  },
  totalVal: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color:    INK,
    width:    80,
    textAlign: "right",
  },
  grandLine: {
    flexDirection:   "row",
    gap:             32,
    paddingVertical: 8,
    marginTop:       2,
    borderTopWidth:  2,
    borderTopColor:  INK,
  },
  grandLabel: {
    fontSize:   10,
    fontFamily: "Helvetica-Bold",
    color:      INK,
    width:      100,
    textAlign:  "right",
  },
  grandVal: {
    fontSize:   13,
    fontFamily: "Helvetica-Bold",
    color:      ORANGE,
    width:      80,
    textAlign:  "right",
  },

  /* ── Payment reference ── */
  payRef: {
    marginTop:       28,
    backgroundColor: BG_SOFT,
    borderRadius:    6,
    padding:         16,
    flexDirection:   "row",
    gap:             32,
  },
  payRefCol: {
    flex: 1,
  },
  payRefLabel: {
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
    color:      INK5,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  payRefVal: {
    fontSize: 9,
    color:    INK2,
  },

  /* ── Footer ── */
  footer: {
    position:       "absolute",
    bottom:         36,
    left:           52,
    right:          52,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop:     12,
    flexDirection:  "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7.5,
    color:    INK5,
  },
  footerBrand: {
    fontSize:   7.5,
    fontFamily: "Helvetica-Bold",
    color:      ORANGE,
  },
});

/* ─── Props ─── */
export interface InvoiceData {
  invoiceNumber:     string;
  date:              string;
  customerName:      string;
  customerEmail:     string;
  expertName:        string;
  sessionDate:       string;
  sessionMinutes:    number;
  amountINR:         number;
  razorpayPaymentId: string;
  razorpayOrderId:   string;
  logoPath:          string;
}

/* ─── Component ─── */
export function InvoicePDF({
  invoiceNumber,
  date,
  customerName,
  customerEmail,
  expertName,
  sessionDate,
  sessionMinutes,
  amountINR,
  razorpayPaymentId,
  razorpayOrderId,
  logoPath,
}: InvoiceData) {
  const amt = `INR ${amountINR.toLocaleString("en-IN")}`;

  return (
    <Document title={`GrowQR Invoice ${invoiceNumber}`} author="GrowQR Advisory">
      <Page size="A4" style={s.page}>

        {/* ── Logo + Invoice title ── */}
        <View style={s.top}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoPath} style={s.logo} />
          <View style={s.topRight}>
            <Text style={s.invoiceTitle}>Invoice</Text>
            <Text style={s.invoiceNum}>{invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.rule} />

        <View style={s.body}>

          {/* Meta */}
          <View style={s.meta}>
            <View style={s.metaCol}>
              <Text style={s.metaLabel}>Issue Date</Text>
              <Text style={s.metaVal}>{date}</Text>
            </View>
            <View style={s.metaCol}>
              <Text style={s.metaLabel}>Status</Text>
              <View style={s.paidPill}>
                <Text style={s.paidPillText}>Paid</Text>
              </View>
            </View>
            <View style={s.metaCol}>
              <Text style={s.metaLabel}>Payment Method</Text>
              <Text style={s.metaVal}>Razorpay</Text>
            </View>
          </View>

          {/* Parties */}
          <View style={s.parties}>
            <View style={s.party}>
              <Text style={s.partyLabel}>Billed To</Text>
              <Text style={s.partyName}>{customerName}</Text>
              <Text style={s.partyLine}>{customerEmail}</Text>
            </View>
            <View style={s.party}>
              <Text style={s.partyLabel}>Billed By</Text>
              <Text style={s.partyName}>GrowQR Advisory</Text>
              <Text style={s.partyLine}>support@growqr.ai</Text>
              <Text style={s.partyLine}>growqr.ai</Text>
            </View>
          </View>

          <View style={s.sep} />

          {/* Table header */}
          <View style={s.tHead}>
            <Text style={[s.tHeadText, s.cDesc]}>Description</Text>
            <Text style={[s.tHeadText, s.cQty]}>Qty</Text>
            <Text style={[s.tHeadText, s.cAmt]}>Amount</Text>
          </View>

          {/* Row */}
          <View style={s.tRow}>
            <View style={s.cDesc}>
              <Text style={s.itemTitle}>Expert Session</Text>
              <Text style={s.itemDetail}>{expertName}</Text>
              <Text style={s.itemDetail}>{sessionMinutes} min  |  1:1 Video Consultation</Text>
              <Text style={s.itemDetail}>{sessionDate}</Text>
            </View>
            <Text style={[s.cQty, s.cellText]}>1</Text>
            <Text style={[s.cAmt, s.cellText, { fontFamily: "Helvetica-Bold" }]}>{amt}</Text>
          </View>

          {/* Totals */}
          <View style={s.totals}>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalVal}>{amt}</Text>
            </View>
            <View style={s.totalLine}>
              <Text style={s.totalLabel}>Tax</Text>
              <Text style={s.totalVal}>Included</Text>
            </View>
            <View style={s.grandLine}>
              <Text style={s.grandLabel}>Total Paid</Text>
              <Text style={s.grandVal}>{amt}</Text>
            </View>
          </View>

          {/* Payment reference */}
          <View style={s.payRef}>
            <View style={s.payRefCol}>
              <Text style={s.payRefLabel}>Payment ID</Text>
              <Text style={s.payRefVal}>{razorpayPaymentId}</Text>
            </View>
            <View style={s.payRefCol}>
              <Text style={s.payRefLabel}>Order ID</Text>
              <Text style={s.payRefVal}>{razorpayOrderId}</Text>
            </View>
          </View>

        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            This is a computer-generated invoice. For support, contact support@growqr.ai
          </Text>
          <Text style={s.footerBrand}>growqr.ai</Text>
        </View>

      </Page>
    </Document>
  );
}
