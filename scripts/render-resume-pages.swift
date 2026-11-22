// Renders every page of one résumé PDF to a PNG (2.5x the PDF's size; resume-pages.mjs turns it
// into WebP) for the in-site preview, and writes its manifest entry with the PDF's SHA-256 so a
// test notices when the PDF changes without new pictures. macOS only (PDFKit).
// Usage (through pnpm resume:pages): swift render-resume-pages.swift <pdf> <outDir> <srcPrefix> <entry.json>
import AppKit
import CryptoKit
import PDFKit

let args = CommandLine.arguments
guard args.count == 5 else { fatalError("usage: <pdf> <outDir> <srcPrefix> <entry.json>") }
let (pdfPath, outDir, srcPrefix, manifestPath) = (args[1], args[2], args[3], args[4])
let scale: CGFloat = 2.5

guard let data = FileManager.default.contents(atPath: pdfPath), let doc = PDFDocument(data: data) else {
  fatalError("cannot read \(pdfPath)")
}
let sha = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
var pages: [[String: Any]] = []
for i in 0..<doc.pageCount {
  guard let page = doc.page(at: i) else { continue }
  let box = page.bounds(for: .mediaBox)
  let w = Int(box.width * scale), h = Int(box.height * scale)
  let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
  NSGraphicsContext.saveGraphicsState()
  let ctx = NSGraphicsContext(bitmapImageRep: rep)!
  NSGraphicsContext.current = ctx
  let cg = ctx.cgContext
  cg.setFillColor(NSColor.white.cgColor)
  cg.fill(CGRect(x: 0, y: 0, width: w, height: h))
  cg.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: cg)
  NSGraphicsContext.restoreGraphicsState()
  let name = "pagina-\(i + 1).png"
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
  pages.append(["src": "\(srcPrefix)/\(name)", "width": w, "height": h])
}
let manifest: [String: Any] = ["pdfSha256": sha, "pages": pages]
let json = try! JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try! (String(data: json, encoding: .utf8)! + "\n").write(toFile: manifestPath, atomically: true, encoding: .utf8)
print("rendered \(pages.count) page(s)")
