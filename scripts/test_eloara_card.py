from pathlib import Path
import re, unittest
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Cards(HTMLParser):
 def __init__(self): super().__init__(); self.cards=[]; self.current=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a' and 'domain-card' in a.get('class','').split(): self.current={'attrs':a,'text':''};self.cards.append(self.current)
 def handle_endtag(self,tag):
  if tag=='a': self.current=None
 def handle_data(self,text):
  if self.current is not None: self.current['text']+=text
class EloaraTest(unittest.TestCase):
 def test_cards(self):
  html=(ROOT/'index.html').read_text();p=Cards();p.feed(html)
  self.assertEqual(len(p.cards),9)
  names=['minhagrana','sharenote','pulse','eloara','airadar','drone','rivals','acervogamer','vagacheck']
  self.assertEqual([c['attrs']['class'].split()[-1] for c in p.cards],['domain-card-pulse' if n=='pulse' else 'domain-'+n for n in names])
  self.assertEqual(re.findall(r'class="domain-index">(\d+)',html),[f'{n:02}' for n in range(1,10)])
  c=p.cards[3];self.assertEqual(c['attrs']['href'],'https://eloara.lagrimante.com.br/');self.assertIn('noopener',c['attrs']['rel']);self.assertEqual(c['attrs']['target'],'_blank')
  self.assertIn('Eloara',c['text']);self.assertIn('desenvolvimento',c['text']);self.assertNotIn('LIVE',c['text'])
  novo=p.cards[8];self.assertEqual(novo['attrs']['href'],'https://vagacheck.lagrimante.com.br');self.assertIn('noopener',novo['attrs']['rel'])
  self.assertIn('VagaCheck',novo['text'])
  baseline=ROOT/'docs/qa/eloara/baseline-index.html'
  if baseline.exists():
   original=re.findall(r'      <a class="domain-card.*?</a>',baseline.read_text(),re.S)
   current=re.findall(r'      <a class="domain-card.*?</a>',html,re.S)
   strip=lambda s:re.sub(r'(class="domain-index">)\d+',r'\1',s)
   self.assertTrue(all(strip(c) in [strip(x) for x in current] for c in original))
if __name__=='__main__':unittest.main()
