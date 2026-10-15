"""Contrôle d'une facture Factur-X : extraction du XML embarqué, profil, validation XSD officielle.

    python3 -m venv .fx && .fx/bin/pip install factur-x
    .fx/bin/python -I scripts/dev/check_facturx.py facture.pdf
"""
import sys

from facturx import get_facturx_xml_from_pdf, get_flavor, get_level, xml_check_xsd
from lxml import etree

name, xml = get_facturx_xml_from_pdf(open(sys.argv[1], "rb").read(), check_xsd=False)
root = etree.fromstring(xml)
level = get_level(root)
print(f"fichier embarqué : {name} · {get_flavor(root)} {level}")
print("XSD :", "valide" if xml_check_xsd(xml, flavor="factur-x", level=level) else "INVALIDE")
