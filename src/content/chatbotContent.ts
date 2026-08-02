export const CHATBOT_CONTENT_VERSION = "2026-08-02.en-CA.v1";

export const CHATBOT_ENQUIRY_NOTICE =
  "Estate Nest Inc. will use the information you provide to respond to your enquiry, create a prospect record and arrange advisor follow-up. Please do not enter medical, banking or other sensitive information in this chat.";

export const CHATBOT_ENQUIRY_CONSENT =
  "I agree that Estate Nest Inc. may collect and use the information I provide to respond to this enquiry, create a prospect record, and arrange licensed-advisor follow-up.";

export const CHATBOT_MARKETING_CONSENT =
  "I would like to receive occasional Estate Nest insurance updates and educational information.";

export const CHATBOT_DISCLAIMER =
  "Information provided through this chatbot is general and is not legal, tax, medical or individualized insurance advice. Coverage, eligibility, premiums, exclusions and underwriting decisions depend on the insurer and policy terms. A licensed Estate Nest advisor will confirm any recommendation.";

export const CHATBOT_SENSITIVE_WARNING =
  "For your privacy, please do not enter medical, banking, identification or other sensitive information in this chat. A licensed advisor can explain the appropriate secure process.";

export const CHATBOT_CLOSING_MESSAGE =
  "Thank you for contacting Estate Nest Inc. Your enquiry has been received, and a licensed advisor will follow up as soon as reasonably possible. For any additional questions, email hello@estatenest.ca and wait for us to respond back.";

export const CHATBOT_DECLINED_MESSAGE =
  "Thank you for your valuable time. If you change your mind, restart the chat, call 780-860-3191, or email hello@estatenest.ca to speak with a licensed advisor. Thanks again for visiting Estate Nest Inc.";

export const chatbotProducts = [
  { code: "LIFE_INSURANCE", label: "Life Insurance", crmInterest: "TERM_LIFE", quoteValue: "Life Insurance" },
  { code: "CRITICAL_ILLNESS", label: "Critical Illness Insurance", crmInterest: "CRITICAL_ILLNESS", quoteValue: "Critical Illness Insurance" },
  { code: "DISABILITY", label: "Disability Insurance", crmInterest: "DISABILITY", quoteValue: "Disability Insurance" },
  { code: "TRAVEL", label: "Travel Insurance", crmInterest: "TRAVEL", quoteValue: "Travel Insurance" },
  { code: "GROUP_BENEFITS", label: "Group Benefits", crmInterest: "BUSINESS", quoteValue: "Group Benefits" },
  { code: "BUSINESS_INSURANCE", label: "Business Insurance", crmInterest: "BUSINESS", quoteValue: "Buy-Sell / Criss-Cross Insurance" },
  { code: "MORTGAGE_PROTECTION", label: "Mortgage Protection", crmInterest: "MORTGAGE_PROTECTION", quoteValue: "Mortgage Insurance" },
  { code: "SEGREGATED_FUNDS", label: "Segregated Funds", crmInterest: "SEGREGATED_FUNDS", quoteValue: "Segregated Funds (RRSP)" },
  { code: "NOT_SURE", label: "Not Sure Yet", crmInterest: "OTHER", quoteValue: "Other" },
] as const;

export type ChatbotProductCode = (typeof chatbotProducts)[number]["code"];

export interface ChatbotFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const chatbotFaqs: ChatbotFaq[] = [
  {
    id: "term-life",
    category: "Life Insurance",
    question: "What is term life insurance?",
    answer:
      "Term life insurance provides coverage for a defined period, such as 10, 20, or 30 years. If the insured person dies while the policy is in force and the claim meets the policy terms, the named beneficiary may receive the death benefit. Premiums, renewal, conversion, exclusions, and eligibility vary by policy and insurer.",
  },
  {
    id: "whole-life",
    category: "Life Insurance",
    question: "How is whole life insurance different?",
    answer:
      "Whole life insurance is designed as permanent coverage while required premiums are paid. It may include a cash-value component, and its premiums are generally higher than comparable term coverage. Guarantees, access to cash value, loans, withdrawals, and their effect on benefits depend on the contract.",
  },
  {
    id: "universal-life",
    category: "Life Insurance",
    question: "What is universal life insurance?",
    answer:
      "Universal life insurance combines permanent life coverage with policy-value features whose costs, investment options, risks, and flexibility depend on the contract. It can be complex, so a licensed advisor should explain the insurer's illustration, fees, guarantees, and non-guaranteed values before any decision.",
  },
  {
    id: "mortgage-protection",
    category: "Mortgage Protection",
    question: "How can personal life insurance help protect a mortgage?",
    answer:
      "Personally owned life insurance may provide a benefit to the beneficiary named in the policy, who can decide how to use it, including for mortgage obligations. Lender creditor insurance may use a different beneficiary structure, declining balance, portability, underwriting, and claims process. Compare the actual policy terms rather than relying on the product label alone.",
  },
  {
    id: "critical-illness",
    category: "Critical Illness Insurance",
    question: "What is critical illness insurance?",
    answer:
      "Critical illness insurance may pay a lump-sum benefit after diagnosis of a condition covered by the policy, provided its definition, survival period, exclusions, and other claim requirements are met. Covered conditions and definitions vary by insurer, so the contract wording is important.",
  },
  {
    id: "disability",
    category: "Disability Insurance",
    question: "What does disability insurance generally do?",
    answer:
      "Disability insurance is intended to replace part of earned income when an insured person meets the policy's definition of disability. Benefit amount, waiting period, benefit period, occupation definition, exclusions, offsets, and underwriting vary by contract and insurer.",
  },
  {
    id: "travel",
    category: "Travel Insurance",
    question: "What should I review in travel insurance?",
    answer:
      "Travel insurance may include emergency medical, trip cancellation or interruption, baggage, and other benefits. Review eligibility, stability periods for pre-existing conditions, exclusions, deductibles, trip length, destination limits, and the assistance process in the actual policy before travelling.",
  },
  {
    id: "group-benefits",
    category: "Group Benefits",
    question: "What can a group benefits plan include?",
    answer:
      "A group benefits plan may include health, dental, life, disability, critical illness, or employee-assistance benefits. Available features, eligibility, participation rules, cost sharing, taxation, and insurer requirements depend on the employer, plan design, and contract.",
  },
  {
    id: "business-insurance",
    category: "Business Insurance",
    question: "How can insurance support a business?",
    answer:
      "Business-owned coverage may help address risks involving a key person, debt, succession, or a funded buy-sell arrangement. Ownership, beneficiary structure, valuation, tax treatment, and legal agreements require coordinated advice from licensed insurance, legal, and tax professionals.",
  },
  {
    id: "beneficiary-basics",
    category: "Policy Basics",
    question: "What is a beneficiary?",
    answer:
      "A beneficiary is the person or entity designated to receive a policy benefit when the policy terms are met. Rules for revocable or irrevocable designations, minors, estates, trusts, and changes vary by province and circumstances. Legal advice may be appropriate for complex designations.",
  },
  {
    id: "application-process",
    category: "Application Process",
    question: "What generally happens after an insurance application?",
    answer:
      "After an application is submitted, the insurer may review identity, financial purpose, occupation, lifestyle, and health information through its approved process. It may request additional information before deciding whether to offer coverage and on what terms. Estate Nest cannot promise approval or timing.",
  },
  {
    id: "underwriting",
    category: "Application Process",
    question: "What is underwriting?",
    answer:
      "Underwriting is the insurer's process for assessing an application against its guidelines. The insurer—not the chatbot or Estate Nest—decides eligibility, premium class, exclusions, ratings, postponement, or decline based on the information and evidence it requires.",
  },
];

export const CHATBOT_FAQ_FALLBACK =
  "I can provide general information, but a licensed Estate Nest advisor should review your circumstances before any recommendation is made.";
