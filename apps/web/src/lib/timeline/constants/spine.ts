/**
 * Both the fill and the nodes are measured against the viewport's midline, and
 * they must be measured against the *same* line.
 *
 * The prototype leads the node by 40px, so a card lit while the rule was still
 * 40px short of its dot — two answers to one question, visible as a card
 * brightening a few frames early. The fill's leading edge sits exactly on this
 * line (see `computeSpineFill`), so a node is passed exactly when the rule
 * reaches it, and the lead is gone rather than copied.
 */
export const MIDLINE_RATIO = 0.5;

export const NO_FILL = 0;
export const FULL_FILL = 1;
