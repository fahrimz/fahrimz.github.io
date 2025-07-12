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
        <div className="size-20" />
        <div
          className="bg-blue-500 text-white rounded-lg shadow-md size-20 flex justify-center items-center cursor-pointer"
          onClick={onUp}
        >
          Up
        </div>
        <div className="size-20" />
      </div>
      {/* left right */}
      <div className="flex flex-row">
        <div
          className="bg-blue-500 text-white rounded-lg shadow-md size-20 flex justify-center items-center cursor-pointer"
          onClick={onLeft}
        >
          Left
        </div>
        <div className="size-20" />
        <div
          className="bg-blue-500 text-white rounded-lg shadow-md size-20 flex justify-center items-center cursor-pointer"
          onClick={onRight}
        >
          Right
        </div>
      </div>
      {/* down */}
      <div className="flex flex-row">
        <div className="size-20" />
        <div
          className="bg-blue-500 text-white rounded-lg shadow-md size-20 flex justify-center items-center"
          onClick={onDown}
        >
          Down
        </div>
        <div className="size-20" />
      </div>
    </div>
  );
};

export default ArrowControls;
