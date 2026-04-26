const calculateAppraisal = () => {
  const valid = comparables.filter(c => c.area > 0 && c.value > 0);
  if (!valid.length) return alert('PREENCHA OS DADOS CORRETAMENTE');

  // 1. calcula valor por m² ajustado pelos fatores
  const normalized = valid.map(c => {
    const base = c.value / c.area;

    const factorMultiplier =
      c.factors?.reduce((acc, f) => acc * (f.value || 1), 1) || 1;

    return base * factorMultiplier;
  });

  // 2. média inicial
  const mean =
    normalized.reduce((a, b) => a + b, 0) / normalized.length;

  // 3. desvio padrão
  const variance =
    normalized.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
    normalized.length;

  const stdDev = Math.sqrt(variance);

  // 4. filtro estilo Chauvenet (simplificado)
  const filtered = normalized.filter(v => {
    const deviation = Math.abs(v - mean) / stdDev;
    return deviation <= 2; // aproximação prática do critério
  });

  const finalValues = filtered.length ? filtered : normalized;

  // 5. média final
  const finalMean =
    finalValues.reduce((a, b) => a + b, 0) / finalValues.length;

  // 6. valor estimado
  const estimated = finalMean * targetProperty.area;

  const final = {
    estimatedValue: estimated,
    valuePerSqm: finalMean,
  };

  setResult(final);

  addCalculation({
    userId: user!.id,
    targetProperty,
    comparables: valid,
    factors,
    result: final,
  });

  setStep('result');
};