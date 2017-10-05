import { parse } from "../code/parser";

test("parsing AST", () => {
  const subject = `
    function PointXYZ(xComponent?:number, yComponent?:number, zComponent?:number, system?:any):number {
      return 1;
    }

    function Move(geometry?:number, motion?:number):{ geometry:number, transform:number } {
      return { geometry, transform: motion };
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
    components: [
      {
        name: "PointXYZ",
        inports: {
          // xComponent: {
          //   required: false,
          //   type: "number",
          //   defaultValue: 10
          // }
          "xComponent?": "number",
          "yComponent?": "number",
          "zComponent?": "number",
          "system?": "any"
        },
        outport: "number"
      },
      {
        name: "Move",
        inports: {
          "geometry?": "number",
          "motion?": "number"
        },
        outports: {
          geometry: "number",
          transform: "number"
        }
      },
      {
        name: "UnitX",
        inports: {
          "factor?": "number"
        },
        outport: "number"
      },
      {
        name: "Radians",
        inports: {
          "degrees?": "number"
        },
        outport: "number"
      },
      {
        name: "Rotate",
        inports: {
          "geometry?": "number",
          "angle?": "number",
          "plane?": "number"
        },
        outport: "number"
      }
    ],
    processes: [
      {
        component: "PointXYZ",
        name: "p",
        // inputs: 0
        // inputs: {}
      },
      {
        component: "UnitX",
        name: "x",
        // inputs: 1
        inputs: {
          "factor?": "$i" //4
        }
      },
      {
        component: "Rotate",
        name: "_Rotate0",
        // inputs: 2
        // inputs: ["$_Move0>geometry", "$_Radians0"]
        inputs: {
          "geometry?": "$_Move0>geometry",
          "angle?": "$_Radians0"
        }
      },
      {
        component: "Move",
        name: "_Move0",
        // inputs: 2
        // inputs: ["$p", "$x"]
        inputs: {
          "geometry?": "$p",
          "motion?": "$x"
        }
      },
      {
        component: "Radians",
        name: "_Radians0",
        // inputs: 1
        // inputs: [60]
        inputs: {
          "degrees?": 60
        }
      }
    ]
  };

  expect(parse(subject)).toEqual(result);
});
