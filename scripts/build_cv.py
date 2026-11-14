# /// script
# requires-python = ">=3.10"
# dependencies = ["reportlab>=4"]
# ///
"""Builds the one-page resume PDF served by the site.

Usage: uv run scripts/build_cv.py [output.pdf]
Default output: public/curriculo-gustavo-fiorotti.pdf. The phone number is intentionally
left out because this PDF is public; career text mirrors contexto-linkedin-curriculo.md.
"""
import sys
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (HRFlowable, ListFlowable, ListItem, Paragraph,
                                SimpleDocTemplate, Spacer, Table, TableStyle)

OUT = sys.argv[1] if len(sys.argv) > 1 else str(
    Path(__file__).resolve().parent.parent / "public" / "curriculo-gustavo-fiorotti.pdf")
ACCENT = HexColor("#1F3A5F")
MUTED = HexColor("#555555")

base = ParagraphStyle("base", fontName="Helvetica", fontSize=9.4, leading=12.4, alignment=TA_LEFT)
name = ParagraphStyle("name", parent=base, fontName="Helvetica-Bold", fontSize=20, leading=23, textColor=ACCENT)
role = ParagraphStyle("role", parent=base, fontSize=11, leading=14, textColor=MUTED)
contact = ParagraphStyle("contact", parent=base, fontSize=9, leading=12, textColor=MUTED)
section = ParagraphStyle("section", parent=base, fontName="Helvetica-Bold", fontSize=10.5, leading=13,
                         textColor=ACCENT, spaceBefore=7, spaceAfter=2)
item_title = ParagraphStyle("item_title", parent=base, fontName="Helvetica-Bold", fontSize=9.8)
item_right = ParagraphStyle("item_right", parent=base, fontSize=9, textColor=MUTED, alignment=2)
sub = ParagraphStyle("sub", parent=base, textColor=MUTED, fontSize=9)
bullet = ParagraphStyle("bullet", parent=base)


def link(url, label=None):
    return f'<link href="https://{url}" color="#1F3A5F">{label or url}</link>'


def heading(text):
    return [Paragraph(text.upper(), section),
            HRFlowable(width="100%", thickness=0.6, color=ACCENT, spaceBefore=0, spaceAfter=4)]


def row(left, right):
    t = Table([[Paragraph(left, item_title), Paragraph(right, item_right)]], colWidths=["72%", "28%"])
    t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                           ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                           ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    return t


def bullets(items):
    return ListFlowable([ListItem(Paragraph(i, bullet), leftIndent=10, value="•") for i in items],
                        bulletType="bullet", start="•", leftIndent=10, bulletFontSize=8, spaceBefore=1, spaceAfter=3)


story = [
    Paragraph("Gustavo Fiorotti", name),
    Paragraph("Desenvolvedor Fullstack Júnior", role),
    Spacer(1, 3),
    Paragraph("Cariacica, ES &nbsp;·&nbsp; "
              + '<link href="mailto:zgustavof@gmail.com" color="#1F3A5F">zgustavof@gmail.com</link>'
              + " &nbsp;·&nbsp; " + link("linkedin.com/in/gustavofiorotti")
              + " &nbsp;·&nbsp; " + link("github.com/gustavofiorotti"), contact),
]

story += heading("Resumo")
story.append(Paragraph(
    "Estudante de Ciência da Computação com experiência em desenvolvimento Fullstack com TypeScript, React, "
    "Next.js, NestJS e PostgreSQL. Atuei na evolução de uma plataforma de integração de sistemas, do frontend "
    "ao deploy em servidores de clientes. Comecei em suporte de TI e migrei para o desenvolvimento. Busco "
    "vaga júnior em desenvolvimento de software.", base))

story += heading("Experiência")
story.append(row("Globalsys · Estagiário Fullstack", "jun/2026 – ago/2026"))
story.append(Paragraph("Vila Velha, ES · Transferência interna do suporte para o time de desenvolvimento do Gnexum, "
                       "plataforma para criar e gerenciar APIs e integrar bancos de dados e ERPs", sub))
story.append(bullets([
    "Desenvolvi melhorias e correções na API com NestJS e PostgreSQL.",
    "Conectei a plataforma a ERPs por APIs, criando rotas de integração, inclusive pelo MCP (Model Context Protocol) do Gnexum.",
    "Reformulei telas, melhorei UI e contraste e padronizei as mensagens de erro da interface com React e Next.js.",
    "Configurei a plataforma em servidores de clientes com SSH, Docker, Nginx e Cloudflare, e ambientes no Azure DevOps.",
    "Dei suporte a clientes em dúvidas e problemas no uso da plataforma.",
]))
story.append(row("Globalsys · Estagiário de Suporte N1", "nov/2025 – jun/2026"))
story.append(bullets([
    "Suporte a colaboradores de um cliente por portal de chamados, e-mail e chat, com acesso remoto, VPN e instalação de softwares.",
    "Gestão de acessos com Active Directory, Google Admin Console e Google Workspace.",
    "Atualizei a documentação técnica da equipe, com sistemas e procedimentos de atendimento.",
    "Recebi proposta de efetivação como Analista de TI e optei por seguir como estagiário para migrar para desenvolvimento.",
]))

story += heading("Projetos")
projects = [
    ("juridiQue", "mai/2026 – jul/2026", "github.com/gustavofiorotti/juridiQue",
     "Aplicação web que traduz documentos jurídicos em PDF para linguagem simples com IA generativa. "
     "Python, Flask, SQL Server e Google Gemini."),
    ("Mão na Obra", "set/2025 – dez/2025", "maonaobra.vercel.app",
     "App que conecta clientes a profissionais de serviços locais, com cadastro e login por perfil. Projeto de "
     "grupo na UVV, no qual propus a ideia e fiz o desenvolvimento, com React, TypeScript e testes com Vitest."),
    ("UVVendas", "ago/2025 – dez/2025", "ecommerce-uvv.vercel.app",
     "E-commerce com catálogo, carrinho e painel do vendedor, feito em grupo na UVV. Contribuí na interface "
     "e na identidade visual, com React, TypeScript e Tailwind CSS."),
    ("Banestes", "abr/2025 – mai/2025", "gustavofiorotti.github.io/projetoBanestes",
     "Painel de consulta de clientes, contas e agências, feito para um processo seletivo, com React e "
     "TypeScript, usando dados fictícios."),
]
for title, dates, url, desc in projects:
    story.append(row(f"{title} &nbsp;<font name='Helvetica' size='8.6' color='#1F3A5F'>{link(url)}</font>", dates))
    story.append(Paragraph(desc, base))
    story.append(Spacer(1, 4))

story += heading("Formação")
story.append(row("Universidade Vila Velha (UVV) · Bacharelado em Ciência da Computação", "jan/2024 – dez/2027"))
story.append(Paragraph("6º período, turno noturno", sub))

story += heading("Competências")
skills = [
    ("Linguagens", "TypeScript, JavaScript, Python, C#, SQL"),
    ("Frontend", "React, Next.js, Tailwind CSS, HTML e CSS"),
    ("Backend e dados", "NestJS, Flask, APIs REST, PostgreSQL, SQL Server, MySQL"),
    ("Infra e ferramentas", "Docker, Nginx, Cloudflare, SSH, Git, Azure DevOps"),
    ("IA no desenvolvimento", "Claude Code, agentes de IA e MCP (Model Context Protocol)"),
]
for k, v in skills:
    story.append(Paragraph(f"<b>{k}:</b> {v}", base))

story += heading("Idiomas e certificações")
story.append(Paragraph("<b>Inglês avançado:</b> EF SET C1 (70/100) e TOEIC Bridge (94/100)", base))
story.append(Paragraph("<b>Oracle:</b> Database Foundations", base))

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=11 * mm,
                        bottomMargin=9 * mm, title="Currículo - Gustavo Fiorotti", author="Gustavo Fiorotti")
doc.build(story)
