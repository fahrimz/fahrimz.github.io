const ArrowControls = ({
  onUp,
  onDown,
  onLeft,
  onRight,
}: {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
}) => {
  return (
    <div className="flex flex-col justify-center items-center md:hidden">
      {/* up */}
      <div className="flex flex-row">
        <div className="size-14" />
        <div
          className="bg-blue-500 text-white text-sm sm:text-base rounded-lg shadow-md size-14 flex justify-center items-center cursor-pointer"
          onClick={onUp}
        >
          Up
        </div>
        <div className="size-14" />
      </div>
      {/* left right */}
      <div className="flex flex-row">
        <div
          className="bg-blue-500 text-white text-sm sm:text-base rounded-lg shadow-md size-14 flex justify-center items-center cursor-pointer"
          onClick={onLeft}
        >
          Left
        </div>
        <div className="size-14" />
        <div
          className="bg-blue-500 text-white text-sm sm:text-base rounded-lg shadow-md size-14 flex justify-center items-center cursor-pointer"
          onClick={onRight}
        >
          Right
        </div>
      </div>
      {/* down */}
      <div className="flex flex-row">
        <div className="size-14" />
        <div
          className="bg-blue-500 text-white text-sm sm:text-base rounded-lg shadow-md size-14 flex justify-center items-center"
          onClick={onDown}
        >
          Down
        </div>
        <div className="size-14" />
      </div>
    </div>
  );
};

export default ArrowControls;
