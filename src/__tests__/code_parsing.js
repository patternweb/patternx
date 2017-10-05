import { parse } from "../code/parser";

test("parsing AST", () => {
  const subject = `
    function PointXYZ(xComponent?:number, yComponent?:number, zComponent?:number, system?:any):number {
      return 1;
    }

    function Move(geometry?:number, motion?:number):{ geometry:number, transform:number } {
      return { geometry, transform: motion};
    }

    function UnitX(factor?:number):number {
      return factor;
    }

    function Radians(degrees?:number):number {
      return degrees * Math.PI / 180;
    }

    function Rotate(geometry?:number, angle?:number, plane?:number):number {
      return geometry;
    }

    // nodes

    const i = 4
    const p = PointXYZ()
    const x = UnitX(i)
    Rotate(Move(p, x).geometry, Radians(60))`;

  const result = {
    components: ["PointXYZ", "Move", "UnitX", "Radians", "Rotate"],
    processes: [
      {
        component: "PointXYZ",
        name: "p",
        inputs: 0 //[]
      },
      {
        component: "UnitX",
        name: "x",
        inputs: 1 //["i"]
      },
      {
        component: "Rotate",
        inputs: 2 //[]
      },
      {
        component: "Move",
        inputs: 2 //["p", "x"]
      },
      {
        component: "Radians",
        inputs: 1 //[60]
      }
    ]
  };

  expect(parse(subject)).toEqual(result);
});
