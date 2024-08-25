// 校验是否为正整数
const isPositiveInteger = s => Number.isInteger(s) && s >= 0;

// 校验是否为有效字符串
const isValidString = filename => {
  return typeof filename === 'string' && filename.length > 0;
};

const isEffective = s => s !== undefined && s !== null;

module.exports = {
  isPositiveInteger,
  isValidString,
  isEffective,
};
