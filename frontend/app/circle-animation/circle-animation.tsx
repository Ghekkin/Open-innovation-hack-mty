import React from "react";
import { motion } from "framer-motion";

const FuturisticAssistantCircle: React.FC = () => {
  return (
    <div className="w-full h-screen flex justify-center items-center bg-black">
      <motion.div
        className="rounded-full"
        style={{ width: 150, height: 150, border: "4px solid #FF0044" }}
        animate={{
          boxShadow: [
            "0 0 10px #FF0044, 0 0 30px #FF0044",
            "0 0 20px #FF0044, 0 0 60px #FF0044"
          ],
          scale: [1, 1.2, 1]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </div>
  );
};
export default FuturisticAssistantCircle;
