import { BankrollDashboard } from "@/components/bankroll/bankroll-dashboard";
import {
  bankrollRules,
  entryMethods,
  initialBankroll,
  operations,
  riskPlan,
  strategies,
} from "@/lib/bankroll/mock-data";

export default function BankrollPage() {
  return (
    <BankrollDashboard
      bankrollRules={bankrollRules}
      entryMethods={entryMethods}
      initialBankroll={initialBankroll}
      initialOperations={operations}
      riskPlan={riskPlan}
      strategies={strategies}
    />
  );
}
