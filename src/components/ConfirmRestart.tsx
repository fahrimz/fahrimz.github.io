import React, { useState } from "react";
import { motion } from "motion/react";

function ConfirmRestart({
  score,
  onRestart,
  onCancel,
}: {
  score: number;
  onRestart: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      className="absolute bg-white z-50 shadow-xl rounded-lg max-w-xl"
      key="modal"
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col justify-center items-center gap-8 w-xs h-fit p-8">
        <h1 className="text-2xl font-semibold">Game Over!</h1>
        <p className="text-lg">
          Your score is <strong>{score}</strong>. Restart?
        </p>
        <div className="flex flex-row gap-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer"
            onClick={onCancel}
          >
            No
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer"
            onClick={onRestart}
          >
            Yes
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ConfirmRestart;
