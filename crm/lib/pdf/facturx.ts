/**
 * Facture électronique Factur-X (profil BASIC WL) : PDF/A-3b avec le XML CII embarqué.
 * - fichier « factur-x.xml » attaché (AFRelationship Data) et référencé dans /AF du catalogue ;
 * - métadonnées XMP : identification PDF/A-3B + schéma d'extension Factur-X (fx) ;
 * - profil de sortie sRGB (OutputIntent GTS_PDFA1), identifiant de document ;
 * - polices embarquées (cf. commercial.tsx).
 * Conformité vérifiable avec veraPDF / FNFE-MPE ; non validée par un outil officiel dans ce dépôt.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { AFRelationship, PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFString } from "pdf-lib";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function facturxXmp(o: { title: string; author: string; created: Date; producer: string }) {
  const iso = o.created.toISOString().replace(/\.\d{3}Z$/, "Z");
  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
   <pdfaid:part>3</pdfaid:part>
   <pdfaid:conformance>B</pdfaid:conformance>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(o.title)}</rdf:li></rdf:Alt></dc:title>
   <dc:creator><rdf:Seq><rdf:li>${esc(o.author)}</rdf:li></rdf:Seq></dc:creator>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
   <pdf:Producer>${esc(o.producer)}</pdf:Producer>
   <xmp:CreatorTool>${esc(o.producer)}</xmp:CreatorTool>
   <xmp:CreateDate>${iso}</xmp:CreateDate>
   <xmp:ModifyDate>${iso}</xmp:ModifyDate>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
   <fx:DocumentType>INVOICE</fx:DocumentType>
   <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
   <fx:Version>1.0</fx:Version>
   <fx:ConformanceLevel>BASIC WL</fx:ConformanceLevel>
  </rdf:Description>
  <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
   <pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource">
    <pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
    <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
    <pdfaSchema:prefix>fx</pdfaSchema:prefix>
    <pdfaSchema:property><rdf:Seq>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentFileName</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Name of the embedded XML invoice file</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentType</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>INVOICE</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>Version</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Version of the Factur-X XML schema</pdfaProperty:description></rdf:li>
     <rdf:li rdf:parseType="Resource"><pdfaProperty:name>ConformanceLevel</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Conformance level of the embedded XML</pdfaProperty:description></rdf:li>
    </rdf:Seq></pdfaSchema:property>
   </rdf:li></rdf:Bag></pdfaExtension:schemas>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

export async function toFacturX(pdf: Uint8Array, xml: string, o: { number: string; author: string; created?: Date }) {
  const created = o.created ?? new Date();
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const title = `Facture ${o.number}`;
  doc.setTitle(title);
  doc.setAuthor(o.author);
  doc.setProducer("MATOCHA back-office");
  doc.setCreator("MATOCHA back-office");
  doc.setCreationDate(created);
  doc.setModificationDate(created);
  await doc.attach(Buffer.from(xml, "utf8"), "factur-x.xml", { mimeType: "text/xml", description: "Factur-X (CII, profil BASIC WL)", creationDate: created, modificationDate: created, afRelationship: AFRelationship.Data });
  await doc.flush(); // matérialise la pièce jointe pour pouvoir la référencer dans /AF

  const ctx = doc.context;
  const catalog = doc.catalog;
  // /AF du catalogue → la spécification de fichier de factur-x.xml
  const names = catalog.lookup(PDFName.of("Names"), PDFDict);
  const ef = names.lookup(PDFName.of("EmbeddedFiles"), PDFDict);
  const arr = ef.lookup(PDFName.of("Names"), PDFArray);
  const fileSpecRef = arr.get(arr.size() - 1);
  catalog.set(PDFName.of("AF"), ctx.obj([fileSpecRef]));
  // Métadonnées XMP (flux non compressé, exigé lisible)
  const meta = ctx.stream(facturxXmp({ title, author: o.author, created, producer: "MATOCHA back-office" }), { Type: "Metadata", Subtype: "XML" });
  catalog.set(PDFName.of("Metadata"), ctx.register(meta));
  // Output intent sRGB
  const icc = readFileSync(path.join(process.cwd(), "lib/pdf/assets/sRGB.icc"));
  const iccStream = ctx.stream(icc, { N: 3, Length: icc.length });
  const intent = ctx.obj({ Type: "OutputIntent", S: "GTS_PDFA1", OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"), Info: PDFString.of("sRGB IEC61966-2.1"), DestOutputProfile: ctx.register(iccStream) });
  catalog.set(PDFName.of("OutputIntents"), ctx.obj([intent]));
  // Identifiant de document (trailer /ID), stable pour un même numéro et un même contenu
  const id = createHash("md5").update(o.number).update(xml).digest("hex");
  ctx.trailerInfo.ID = ctx.obj([PDFHexString.of(id), PDFHexString.of(id)]);
  return doc.save({ useObjectStreams: false }); // PDF/A : pas de flux d'objets compressés requis
}
