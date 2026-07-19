"use client";

export default function DriverCard() {
  return (
    <div
      className="
      mx-5
      mt-6
      rounded-3xl
      border
      border-white/10
      bg-white/10
      p-5
      backdrop-blur-xl
      "
    >
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">

          <div
            className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-gradient-to-r
            from-cyan-500
            to-purple-500
            text-2xl
            "
          >
            👨
          </div>

          <div>

            <h2 className="font-bold text-white">
              Rahul Sharma
            </h2>

            <p className="text-sm text-gray-400">
              ⭐ 4.98 • 1247 Trips
            </p>

          </div>

        </div>

        <div className="text-3xl">
          🚗
        </div>

      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"></div>

      </div>

      <div className="mt-4 flex justify-between">

        <span className="text-gray-400">
          ETA
        </span>

        <span className="font-bold text-cyan-400">
          2 mins
        </span>

      </div>

      <div className="mt-5 flex gap-3">

        <button
          className="
          flex-1
          rounded-xl
          bg-cyan-500
          py-3
          font-semibold
          text-white
          transition
          hover:bg-cyan-400
          "
        >
          Call
        </button>

        <button
          className="
          flex-1
          rounded-xl
          border
          border-white/10
          bg-white/10
          py-3
          font-semibold
          text-white
          transition
          hover:bg-white/20
          "
        >
          Chat
        </button>

      </div>
    </div>
  );
}