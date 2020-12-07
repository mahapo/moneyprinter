export class Matrix {
  static createTestMatrix(matrix, parts = 0) {
    function getCombn(arr) {
      if (arr.length == 1) {
        return arr[0];
      } else {
        var ans = [];
        var otherCases = getCombn(arr.slice(1));
        for (var i = 0; i < otherCases.length; i++) {
          for (var j = 0; j < arr[0].length; j++) {
            ans.push([arr[0][j], otherCases[i]]);
          }
        }
        return ans;
      }
    }
    const values = getCombn(matrix.map((i) => i.steps))
      .map((i) =>
        // @ts-ignore
        Array.isArray(i) ? i.flat() : i
      )
      .map((i) =>
        // @ts-ignore
        Array.isArray(i) ? i.flat() : i
      );
    const keys = matrix.map((i) => i.key);
    const result = values.map((value) =>
      keys.reduce((acc, key, i) => {
        acc[key] = value[i];
        return acc;
      }, {})
    );

    if (parts) return Matrix.splitToChunks(result, parts);
    return result;
  }

  static splitToChunks(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
      result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
  }

  static cartesianProduct(data) {
    return data.reduce((a, b) => a.flatMap((x) => b.map((y) => [...x, y])), [
      [],
    ]);
  }
}
