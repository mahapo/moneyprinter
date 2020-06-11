export class ZoneRecovery {
  static calcSteps(count: number, ratio: number) {
    return [...Array(count)].map((_, i) => ZoneRecovery.calcStep(i, ratio));
  }

  static calcStep(index: number, ratio: number, breakevent: boolean = false) {
    // @ts-ignore
    let lastStep = {
      factor: 1,
      profit: ratio - 1,
      total: 1,
      profitTotal: ratio - 1,
    };
    return [...Array(index)].reduce((step, _, i) => {
      step.factor = (step.profitTotal + lastStep.total) / step.profitTotal;
      step.total = lastStep.total + step.factor;
      step.profit = step.factor * step.profitTotal;
      lastStep = step;
      return step;
    }, lastStep);
  }
}
