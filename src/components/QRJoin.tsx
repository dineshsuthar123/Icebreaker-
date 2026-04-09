"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRJoinProps {
  joinCode: string;
  joinUrl: string;
}

export default function QRJoin({ joinCode, joinUrl }: QRJoinProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
        Join This Game
      </h3>
      <QRCodeSVG value={joinUrl} size={180} level="M" />
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400 mb-1">or enter code:</p>
        <p className="text-3xl font-mono font-bold tracking-[0.3em] text-indigo-600">
          {joinCode}
        </p>
      </div>
    </div>
  );
}
