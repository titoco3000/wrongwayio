import { useRef, useState } from "react";
import RenderRoad, { type ExitSide } from "./RenderRoad";
import SteeringWheel from "./SteeringWheel";
import Speedometer from "./Speedometer";
import ViewSwitch from "./ViewSwitch";
import GearShifter, { START_GEAR, type Gear } from "./GearShifter";
import "./Drive.css";

/** Each forward gear is this much faster than the previous one. */
const GEAR_STEP = 1.4;
/** Reverse speed, relative to first gear. */
const REVERSE = -0.4;

/** Speed multiplier of a gear, relative to first gear. */
const gearSpeed = (gear: Gear) => {
  if (gear === "R") return REVERSE;
  return GEAR_STEP ** (Number(gear) - 1);
};

const GEARS: Gear[] = ["1", "2", "3", "4", "5"];

type Props = {
  /** The car left the central tile (and was teleported back to the start). */
  onExit?: (side: ExitSide) => void;
  /** The car reached the far edge of the central tile. */
  onCrash?: () => void;
  /** Distance from a side edge of the tile, as a fraction, at which the car counts as exited. */
  exitMargin?: number;
  /** Called whenever the engaged gear changes. */
  onGear?: (gear: Gear) => void;
};

export default function Drive({ onExit, onCrash, onGear, exitMargin }: Props) {
  const steerRef = useRef(0);
  const speedRef = useRef(gearSpeed(START_GEAR));
  const currentSpeedRef = useRef(speedRef.current);
  const [topDown, setTopDown] = useState(false);
  return (
    <div className="drive">
      <div className="drive__body">
        <RenderRoad
          steerRef={steerRef}
          speedRef={speedRef}
          currentSpeedRef={currentSpeedRef}
          topDown={topDown}
          onExit={onExit}
          onCrash={onCrash}
          exitMargin={exitMargin}
        />
        <div className="drive__wheel">
          <SteeringWheel onSteer={(steer) => (steerRef.current = steer)} />
        </div>
        <div className="drive__shifter">
          <GearShifter
            onGear={(gear) => {
              speedRef.current = gearSpeed(gear);
              onGear?.(gear);
            }}
          />
        </div>
        <div className="drive__view">
          <ViewSwitch topDown={topDown} onChange={setTopDown} />
        </div>
        <div className="drive__speedometer">
          <Speedometer
            speedRef={currentSpeedRef}
            max={gearSpeed("5")}
            marks={GEARS.map(gearSpeed)}
          />
        </div>
      </div>
    </div>
  );
}
