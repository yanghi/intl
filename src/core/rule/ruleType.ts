export enum RuleType {
    SpaceBetweenCJKAndLatin = 1,      // 中英文之间必须有空格
    NoMultipleSpaces = 2,              // 禁止多个连续空格
    NoTrailingSpaces = 3,              // 禁止行尾空格
    NoMixedWidthSpace = 4,             // 禁止混用全角/半角空格

    // 标点规则 (21-40)
    EndWithPunctuation = 21,           // 文本末尾必须有标点
    NoFullWidthPunctuationInLatin = 22,// 英文段落中不使用全角标点
    ProperQuotationUsage = 23,         // 引号使用规范（中文用""，英文用""）
    ProperListPunctuation = 24,        // 列表项标点规范
    NoRepeatPunctuation = 25,          // 禁止重复标点（如。。。）

    // 大小写规则 (41-50)
    CapitalizeFirstLetter = 41,        // 英文段落首字母大写
    ProperNounCapitalization = 42,     // 专有名词大小写（如 iPhone, GitHub）

    // 数字规则 (51-60)
    ProperNumberFormat = 51,           // 数字千分位格式
    NoFullWidthNumber = 52,            // 不使用全角数字

    // 符号规则 (61-70)
    ProperEllipsis = 61,               // 省略号使用规范（中文……，英文...）
    ProperDash = 62,                   // 连接号使用规范（中文用－，英文用-）

    // 空白规则 (71-80)
    NoLeadingSpaces = 71,              // 禁止行首空格

    // 链接与标记规则 (81-90)
    NoSpaceAroundLink = 81,
}
