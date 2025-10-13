import { ShieldCheck, BarChart3 } from "lucide-react";
import { PiChatTeardropTextFill } from "react-icons/pi";
import { MdInsights } from "react-icons/md";

const benefits = [
    { title: "Automated Moderation", desc: "Keep your community safe 24/7 with intelligent, customizable auto-moderation. Say goodbye to spam and rule-breakers.", icon: ShieldCheck },
    { title: "Instant Support", desc: "Our AI agent instantly answers common questions, freeing up your team to handle more complex issues.", icon: PiChatTeardropTextFill },
    { title: "Community Insights", desc: "Gain valuable insights into your server's health and member activity with powerful analytics and reports.", icon: MdInsights },
  ];
  
  const KeyBenefits = () => {
    return (
      <section className="px-4 md:px-6 mb-12">
        <h2 className="sr-only">Key Benefits</h2>
        <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-4 md:gap-6 text-left">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 md:p-6 hover:border-gray-700 transition-colors"
            >
              <div className="mb-3 h-8 w-8 rounded-md bg-gray-800 flex items-center justify-center text-gray-300">
                {b.icon ? <b.icon size={16} /> : null}
              </div>
              <h3 className="text-lg font-semibold mb-1">{b.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };
  
  export default KeyBenefits;
  