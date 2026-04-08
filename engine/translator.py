#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Studio4 — Translator
Tradução de blocos via Claude API (Anthropic).
Traduz headline, subhead, value, disclaimer para múltiplos países.
"""
import os, json, re, requests

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

LANG_MAP = {
    'BR':'pt-BR','AR':'es-AR','MX':'es-MX','US':'en-US','JP':'ja-JP',
    'TR':'tr-TR','PH':'en-PH','BE':'fr-BE','CO':'es-CO','NL':'nl-NL',
    'FR':'fr-FR','UK':'en-GB','KR':'ko-KR','DE':'de-DE','CZ':'cs-CZ',
    'AU':'en-AU','PT':'pt-PT','IT':'it-IT','ES':'es-ES','CA':'en-CA',
    'PE':'es-PE','GR':'el-GR','TH':'th-TH','ID':'id-ID','PL':'pl-PL',
}

CTA_DEFAULTS = {
    'pt-BR':'SIMULAR AGORA','es-AR':'SIMULAR AHORA','es-MX':'SIMULAR AHORA',
    'en-US':'SIMULATE NOW','ja-JP':'今すぐシミュレーション','tr-TR':'HEMEN SİMÜLE ET',
    'en-PH':'SIMULATE NOW','fr-BE':'SIMULER MAINTENANT','es-CO':'SIMULAR AHORA',
    'nl-NL':'NU SIMULEREN','fr-FR':'SIMULER MAINTENANT','en-GB':'SIMULATE NOW',
    'ko-KR':'지금 시뮬레이션','de-DE':'JETZT SIMULIEREN','cs-CZ':'SIMULOVAT NYNÍ',
    'en-AU':'SIMULATE NOW','pt-PT':'SIMULAR AGORA','it-IT':'SIMULA ORA',
    'es-ES':'SIMULAR AHORA','en-CA':'SIMULATE NOW',
    'es-PE':'SIMULAR AHORA','el-GR':'ΠΡΟΣΟΜΟΊΩΣΗ ΤΏΡΑ','th-TH':'จำลองตอนนี้',
    'id-ID':'SIMULASIKAN SEKARANG','pl-PL':'SYMULUJ TERAZ',
}

LANG_NAMES = {
    'pt-BR':'Portuguese (Brazil)','es-AR':'Spanish (Argentina)',
    'es-MX':'Spanish (Mexico)','en-US':'English (US)','ja-JP':'Japanese',
    'tr-TR':'Turkish','en-PH':'English (Philippines)','fr-BE':'French (Belgium)',
    'es-CO':'Spanish (Colombia)','nl-NL':'Dutch','fr-FR':'French',
    'en-GB':'English (UK)','ko-KR':'Korean','de-DE':'German',
    'cs-CZ':'Czech','en-AU':'English (Australia)','pt-PT':'Portuguese (Portugal)',
    'it-IT':'Italian','es-ES':'Spanish (Spain)','en-CA':'English (Canada)',
    'es-PE':'Spanish (Peru)','el-GR':'Greek','th-TH':'Thai',
    'id-ID':'Indonesian','pl-PL':'Polish',
}



# Mapa de valores de crédito típicos por país (fallback quando não há API key)
# Usado para adaptar o bloco "value" ao mercado local
COUNTRY_VALUE_TEMPLATES = {
    'BR': 'R$ {low} a R$ {high}',
    'AR': 'AR$ {low} a AR$ {high}',
    'MX': 'MX$ {low} a MX$ {high}',
    'CO': 'COP {low} a COP {high}',
    'PE': 'S/ {low} a S/ {high}',
    'US': '${low} to ${high}',
    'CA': 'CA${low} to CA${high}',
    'AU': 'A${low} to A${high}',
    'UK': '£{low} to £{high}',
    'FR': '{low}€ à {high}€',
    'DE': '{low}€ bis {high}€',
    'NL': '{low}€ tot {high}€',
    'BE': '{low}€ à {high}€',
    'IT': '{low}€ a {high}€',
    'ES': '{low}€ a {high}€',
    'PT': '{low}€ a {high}€',
    'CZ': 'Kč {low} až Kč {high}',
    'PL': '{low} zł do {high} zł',
    'GR': '{low}€ έως {high}€',
    'JP': '¥{low} 〜 ¥{high}',
    'KR': '₩{low} ~ ₩{high}',
    'TH': '฿{low} ถึง ฿{high}',
    'ID': 'Rp{low} - Rp{high}',
    'PH': '₱{low} to ₱{high}',
    'TR': '₺{low} - ₺{high}',
}

# Multiplicadores de valor monetário aproximados (vs BRL)
CURRENCY_MULTIPLIER = {
    'BR':1.0, 'AR':5.0, 'MX':3.5, 'CO':120.0, 'PE':0.6,
    'US':0.2, 'CA':0.27, 'AU':0.3, 'UK':0.16, 'FR':0.18,
    'DE':0.18, 'NL':0.18, 'BE':0.18, 'IT':0.18, 'ES':0.18,
    'PT':0.18, 'CZ':4.5, 'PL':0.8, 'GR':0.18, 'JP':30.0,
    'KR':260.0, 'TH':7.0, 'ID':3200.0, 'PH':11.0, 'TR':6.0,
}

def _adapt_valor_for_country(valor_text: str, country: str) -> str:
    """Adapta texto de valor monetário para o país alvo sem API."""
    import re
    # Extrair números do texto original
    nums = re.findall(r'[\d.,]+', valor_text.replace('.','').replace(',','.'))
    if len(nums) < 1:
        return valor_text
    try:
        vals = [float(n.replace(',','')) for n in nums[:2]]
        mult = CURRENCY_MULTIPLIER.get(country, 1.0)
        template = COUNTRY_VALUE_TEMPLATES.get(country, COUNTRY_VALUE_TEMPLATES['US'])
        low  = _fmt_num(vals[0] * mult)
        high = _fmt_num(vals[1] * mult) if len(vals) > 1 else _fmt_num(vals[0] * mult * 8)
        return template.format(low=low, high=high)
    except Exception:
        return valor_text

def _fmt_num(n: float) -> str:
    """Formata número para exibição limpa."""
    if n >= 1_000_000:
        return f'{n/1_000_000:.1f}M'.rstrip('0').rstrip('.')
    if n >= 1_000:
        return f'{round(n/1000)*1000:,.0f}'.replace(',','.')
    return str(int(round(n)))

def translate_blocks(blocks, target_country, source_lang='pt-BR'):
    """
    Traduz texto de todos os blocos para o idioma do país alvo.
    - Com API key: tradução via Claude (todos os campos)
    - Sem API key: fallback inteligente
        - CTA: usa CTA_DEFAULTS localizado
        - value: adapta valores monetários ao país (multiplicador + símbolo)
        - headline/sub/disclaimer: mantém original (evitar texto errado)
    """
    global ANTHROPIC_API_KEY
    ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', ANTHROPIC_API_KEY)

    target_lang = LANG_MAP.get(target_country.upper(), 'en-US')
    target_lang_name = LANG_NAMES.get(target_lang, target_lang)

    # Mesmo idioma base — apenas adaptar CTA e valor
    if target_lang == source_lang:
        result = []
        for b in list(blocks):
            nb = dict(b)
            if b.get('type') == 'cta':
                nb['text'] = CTA_DEFAULTS.get(target_lang, b.get('text',''))
            elif b.get('type') == 'value':
                nb['text'] = _adapt_valor_for_country(b.get('text',''), target_country.upper())
            result.append(nb)
        return result

    # Extrair textos traduzíveis
    texts = {}
    for b in blocks:
        if b.get('type') in ('headline','subhead','value','disclaimer','cta') and b.get('text'):
            texts[b['id']] = {'type': b['type'], 'text': b['text']}

    if not texts:
        return list(blocks)

    translated = {}
    if ANTHROPIC_API_KEY:
        translated = _translate_via_claude(texts, target_lang, target_lang_name)

    # Aplicar traduções com fallback inteligente por tipo
    result = []
    for b in blocks:
        nb = dict(b)
        bid = b.get('id','')
        btype = b.get('type','')
        if bid in translated and translated[bid]:
            nb['text'] = translated[bid]
        else:
            # Fallbacks sem API: adaptar campos que fazem sentido local
            if btype == 'cta':
                nb['text'] = CTA_DEFAULTS.get(target_lang, b.get('text','SIMULATE NOW'))
            elif btype == 'value':
                nb['text'] = _adapt_valor_for_country(b.get('text',''), target_country.upper())
            # headline/subhead/disclaimer: manter original (melhor que texto errado)
        result.append(nb)

    return result


def _apply_cta_defaults(blocks, lang):
    result = []
    for b in blocks:
        nb = dict(b)
        if b.get('type') == 'cta':
            nb['text'] = CTA_DEFAULTS.get(lang, b.get('text','SIMULATE NOW'))
        result.append(nb)
    return result


def _translate_via_claude(texts_dict, target_lang, target_lang_name):
    """
    Usa Claude API para traduzir todos os textos de uma vez.
    Retorna dict {id: translated_text}.
    """
    input_json = {bid: v['text'] for bid, v in texts_dict.items()}

    type_hints = '\n'.join(
        f'- id "{bid}": type={v["type"]} — '
        + ('keep urgency, ALL CAPS if original is ALL CAPS' if v['type'] in ('headline','cta')
           else 'natural advertising language' if v['type'] == 'subhead'
           else 'keep numbers/symbols, translate surrounding words only' if v['type'] == 'value'
           else 'accurate legal/financial translation')
        for bid, v in texts_dict.items()
    )

    prompt = f"""You are a professional advertising copywriter.
Translate the following ad copy texts into {target_lang_name} ({target_lang}).

Rules per text type:
{type_hints}

Input JSON (id → text to translate):
{json.dumps(input_json, ensure_ascii=False, indent=2)}

Return ONLY a JSON object with the same keys, values being the translated texts.
No markdown, no explanation, just the JSON."""

    try:
        resp = requests.post(
            'https://api.anthropic.com/v1/messages',
            headers={
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            json={
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 1500,
                'messages': [{'role': 'user', 'content': prompt}],
            },
            timeout=30,
        )
        if resp.status_code == 200:
            text = resp.json()['content'][0]['text'].strip()
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            return json.loads(text)
    except Exception as e:
        print(f'[TRANSLATE] Error: {e}')
    return {}


def get_cta_for_country(country):
    lang = LANG_MAP.get(country.upper(), 'en-US')
    return CTA_DEFAULTS.get(lang, 'SIMULATE NOW')
