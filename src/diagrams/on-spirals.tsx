import { JSX } from "react";

const sin_deg = (x: number): number => (Math.sin(x*Math.PI/180));
const cos_deg = (x: number): number => (Math.cos(x*Math.PI/180));

type StyleType = {
    color?: string,
    visible?: boolean,
    width?: number,
    label?: string,
    label_anchor?: string
}

class BaseStyle {
    color: string;
    visible: boolean;
    label: string;
    label_anchor: string;
    constructor({color, visible=true, label="", label_anchor="sw"}: 
        {color: string, visible?:boolean, label?: string, label_anchor?: string}) {
        this.color = color;
        this.label = label;
        this.visible = visible;
        this.label_anchor = label_anchor;
    }
}

class PointStyle extends BaseStyle {
    width: number;
    constructor ({color="black", width=1, visible=true, label="", label_anchor="sw"}: 
        {color?: string, width?: number, visible?:boolean, 
        label?: string, label_anchor?: string}) {
        super({color, visible, label, label_anchor})
        this.width = 4.0*width;
    }
}

class LineStyle extends BaseStyle {
    width: number;
    constructor ({color="black", width=1, visible=true, label="", label_anchor="sw"}: 
        {color?: string, width?: number, visible?:boolean, 
        label?: string, label_anchor?: string}) {
        super({color, visible, label, label_anchor})
        this.width = 2.0*width;
    }
}

function new_vector(x: number=0, y: number=0, z: number=0) {
    return new Vector(x, y, z);
}

class BaseGeometry {
    transform_4x4(a: Vector[], b: Vector): BaseGeometry {
        throw Error
    }
}

export {BaseGeometry};

class Vector  extends BaseGeometry {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    constructor(x: number=0, y: number=0, z: number=0) {
        super();
        this.x = x; this.y = y; this.z = z;
    }
    copy(): Vector {
        return new_vector(this.x, this.y, this.z);
    }
    add(v: Vector): Vector {
        return this.shift(v.x, v.y, v.z);
    }
    angle_to(v: Vector): number {
        return (180/Math.PI)* Math.acos(this.dot(v) / (this.norm()*v.norm()))
    }
    cross(v: Vector): Vector {
        return new_vector(
            this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x
        );
    }
    dilate(t: number): Vector {
        return new_vector(this.x*t, this.y*t, this.z*t);
    }
    dist_to(v: Vector): number {
        return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2+ (this.z - v.z) ** 2);
    }
    dot(v: Vector): number {
        return this.x*v.x + this.y*v.y+ this.z*v.z;
    }
    norm (): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    }
    shift(dx: number=0, dy: number=0, dz: number=0): Vector {
        return new_vector(this.x+dx, this.y+dy, this.z+dz);
    }
    shift_polar(r: number=0, azim: number=0, lat: number=0) {
        return this.shift(
            r*cos_deg(lat)*cos_deg(azim), r*cos_deg(lat)*sin_deg(azim), r*sin_deg(lat)
        );
    }
    sub(v: Vector): Vector { return this.sub_coords(v.x, v.y, v.z); }
    sub_coords(dx: number=0, dy: number=0, dz: number=0): Vector { 
        return new_vector(this.x-dx, this.y-dy, this.z-dz); 
    }
    toward(v: Vector, t: number=1): Vector {
        return new_vector(
            this.x + t*(v.x-this.x), this.y + t*(v.y-this.y), this.z + t*(v.z-this.z),
        )
    }
    transform_4x4(a: Vector[], b: Vector): Vector {
        return a[0].dilate(this.x)
            .add(a[1].dilate(this.y))
            .add(a[2].dilate(this.z))
            .add(b);
    }
}


// type PointProps = {
//     geometry: PointGeometry,
//     color: string,
//     width: number,
//     label: string
// }

// type PointsProps = {
//     geometry: PointGeometry[],
//     color: string,
//     width: number,
//     label: string
// }

type PointGeometry = Vector;

class LineGeometry extends BaseGeometry {
    from: PointGeometry;
    to: PointGeometry;
    constructor(from: PointGeometry, to: PointGeometry) {
        super();
        this.from = from; this.to = to;
    }
    transform_4x4(a: Vector[], b: Vector): LineGeometry {
        return new LineGeometry(
            this.from.transform_4x4(a, b),
            this.to.transform_4x4(a,b)
        );
    }
}

function lineg (from: PointGeometry, to: PointGeometry) {
    return new LineGeometry(from, to);
}

// type LineProps = {
//     geometry: LineGeometry,
//     color: string,
//     width: number,
//     label: string
// }

function anchor_to_dxdy(anchor: string): number[] {
    let dx: number = 0; let dy: number = 0;
    let r = 0.3;
    if ((anchor === "s") || (anchor === "sw") || (anchor === "se")) {
        dy = -r;
    } else if ((anchor === "n") || (anchor === "sw") || (anchor === "se")) {
        dy = r;
    }
    if ((anchor === "w") || (anchor === "sw") || (anchor === "nw")) {
        dx = r;
    } else if ((anchor === "e") || (anchor === "se") || (anchor === "ne")) {
        dx = -r;
    }
    return [dx-0.1,dy+0.1];
}

const PointDOM = (geometry: PointGeometry, style: PointStyle) => {
    let r: number = 0.001;
    let x: number = geometry.x; let y: number = geometry.y;
    let [dx, dy] = anchor_to_dxdy(style.label_anchor);
    return <>
        <path d={`M ${x+r} ${y} L ${x} ${y+r} L ${x-r} ${y} L ${x} ${y-r} L ${x+r} ${y}`} 
            stroke={style.color} strokeWidth={style.width} strokeLinecap="round" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke" fill="none"/>
        <text x={x+dx} y={y+dy} fontSize={"2.5%"}>{style.label}</text>
    </>
}

// const PointsDOM = ({geometry=[], color="black", width=3, label=""}: PointsProps) => {
//     let r: number = 0.01;
//     let d = geometry.map(
//         g => `M ${g.x+r} ${g.y} L ${g.x} ${g.y+r} L ${g.x-r} ${g.y} L ${g.x} ${g.y-r} L ${g.x+r} ${g.y}`
//     ).join(' ');
//     return <>
//         <path d={d} 
//             stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
//             vectorEffect="non-scaling-stroke" fill="none"/>
//     </>
// }

const LineDOM = (geometry: LineGeometry, style: LineStyle) => {
    let from: PointGeometry = geometry.from;
    let to: PointGeometry = geometry.to;
    let d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    let [dx, dy] = anchor_to_dxdy(style.label_anchor);
    return <>
        <path d={d} stroke={style.color} strokeWidth={`${style.width}px`} vectorEffect="non-scaling-stroke" fill="none"/>
        <text x={(from.x+to.x)/2+dx} y={(from.y+to.y)/2+dy}>{style.label}</text>
    </>
}

const GeneralDOM = ({geometry, style}: {geometry: BaseGeometry|BaseGeometry[], style: StyleType}): JSX.Element => {
    if (geometry instanceof BaseGeometry) {
        if (style.visible !== false) {
            if (geometry instanceof Vector) {
                return PointDOM(geometry, new PointStyle(style));
            } else if (geometry instanceof LineGeometry) {
                return LineDOM(geometry, new LineStyle(style));
            } else {
                throw Error
            }
        } else {
            return <></>
        }
    } else {
        // console.log(geometry, geometry instanceof BaseGeometry)
        return <>{geometry.map((g, idx) => 
            <GeneralDOM key={idx} geometry={g} style={style} />
        )}</>
    }
}

function cumulate_style_deltas(labels_anchors: string[], style_vals: StyleType[][]): StyleType[][] {
    const n_steps: number = style_vals.length - 1;
    const n_styles: number = style_vals[0].length;
    let result: StyleType[][] = [[]];
    for (let m: number=0; m<n_styles; ++m) {
        let tmp_splt: string[] = labels_anchors[m].split(';');
        let label: string = tmp_splt[0];
        let label_anchor: string|undefined = (tmp_splt.length > 1)? tmp_splt[1] : undefined;
        result[0].push({label, label_anchor});
        Object.assign(result[0][m], style_vals[0][m]);
    }
    for (let n: number=0; n<n_steps; ++n) {
        result.push([]);
        for (let m: number=0; m<n_styles; ++m) {
            result[n+1].push({});
            Object.assign(result[n+1][m], result[n][m]);
            Object.assign(result[n+1][m], style_vals[n+1][m]);
        }
    }
    return result;
}


type KineticDiagramConfig = {
    section_id: string,
    n_steps: number,
    params_vals: number[][],
    construction (params: number[]) : (BaseGeometry|BaseGeometry[])[],
    style_vals: StyleType[][],
    paragraph_to_step: number[]
}

function apply_transform_recursively(
    geometry: any[], a: Vector[], b: Vector
): any[] {
    return geometry.map(g => 
        (g instanceof BaseGeometry)? 
        g.transform_4x4(a,b) : (apply_transform_recursively(g,a,b))
    );
}

function emph(color: string="red", width: number=1.5): StyleType {
    return {color, width};
}

function deemph(color: string="black", width: number=1): StyleType {
    return {color, width};
}

export {GeneralDOM, BaseStyle};
export {Vector};
export type { KineticDiagramConfig };

function no_kinetic_diagram(section_id: string): KineticDiagramConfig {
    return {
        section_id,
        n_steps: 0, 
        params_vals: [[]],
        construction: (params: number[]) => [],
        style_vals: [[]],
        paragraph_to_step: []
    }
}

const configs: KineticDiagramConfig[] = [
    no_kinetic_diagram("intro"),
    {
        section_id: "prop01",
        n_steps: 5,
        params_vals: [
            // [lengthGD, lengthDE, ratioAD, ratioBD, ratioLH, 
            // ratioHK, posHx, posHy, inverseVelocity, lockLK],
            [1.2, 0.7, 2.4, 1.5, 3.2,   2, 0.3, -1.3, 0.75, 0],
            [1.2, 0.7, 2.4, 1.5, 3.2,   2, 0.3, -1.3, 0.75, 0],
            [1.2, 0.7, 3.0, 4.0, 3.0,   4, 0.3, -1.3, 0.75, 0],
            [1.2, 0.7, 3.0, 4.0, 3.0,   4, 0.3, -1.3, 0.75, 0],
            [1.2, 0.7, 3.0, 4.0, 3.0,   4, 0.3, -1.3, 0.75, 0],
            // [1.2, 0.7, 2.4, 1.5, 2.0,   5, 0.3, -1.3, 0.75, 0],
            [1.2, 0.7, 2.0, 5.0, 2.0,   5, 0.3, -1.3, 0.75, 0],
        ],
        construction: (params: number[]) => {
            let [
                lengthGD, lengthDE, ratioAD, ratioBD,
                ratioLH, ratioHK,
                posHx, posHy, inverseVelocity, lockLK, 
            ...etc]: number[] = params;

            let D: Vector = new_vector();
            let G: Vector = D.shift(-lengthGD);
            let E: Vector = D.shift(lengthDE);
            let A: Vector = D.toward(G, ratioAD);
            let B: Vector = D.toward(E, ratioBD);

            let H: Vector = D.shift(posHx, posHy);
            let Z: Vector = H.shift(-lengthGD*inverseVelocity);
            let Q: Vector = H.shift(lengthDE*inverseVelocity);
            let L: Vector = H.shift(-ratioLH*lengthGD*inverseVelocity)
                .toward(
                    H.toward(Z, ratioAD),
                    lockLK
                );
            let K: Vector = H.shift(ratioHK*lengthDE*inverseVelocity)
                .toward(
                    H.toward(Q, ratioBD),
                    lockLK
                );

            let ticksAD: Vector[] = [];
            for (let i: number=2; i<ratioAD; i++) { ticksAD.push(D.toward(G, i)); }
            let ticksLH: Vector[] = [];
            for (let i: number=2; i<ratioLH; i++) { ticksLH.push(H.toward(Z, i)); }
            let ticksDB: Vector[] = [];
            for (let i: number=2; i<ratioBD; i++) { ticksDB.push(D.toward(E, i)); }
            let ticksHK: Vector[] = [];
            for (let i: number=2; i<ratioHK; i++) { ticksHK.push(H.toward(Q, i)); }

            // let datas: Pair<string,BaseGeometry>[] = [
            //     ['AG', lineg(A,G)], ['GD', lineg(G,D)], ['DE', lineg(D,E)], ['EB', lineg(E,B)], ['AB', lineg(A,B)],
            //     ['LZ', lineg(L,Z)], ['ZH', lineg(Z,H)], ['HQ', lineg(H,Q)], ['QK', lineg(Q,K)],
            //     ['ticksAD', ticksAD], ['ticksDB', ticksDB], ['ticksLH', ticksLH], ['ticksHK', ticksHK],
            //     ['A', A], ['B', B], ['G', G], ['D', D], ['E', E],
            //     ['Z', Z], ['H', H], ['Q', Q], ['K', K], ['L', L]
            // ]
            // return datas;
            return apply_transform_recursively([
                lineg(A,G), lineg(G,D), lineg(D,E), lineg(E,B), lineg(A,B),
                lineg(L,Z), lineg(Z,H), lineg(H,Q), lineg(Q,K),
                ticksAD, ticksDB, ticksLH, ticksHK,
                A, B, G, D, E,
                Z, H, Q, K, L
            ], 
            [new Vector(1,0,0), new Vector(0,-1,0), new Vector(0,0,0)],
            new Vector(0,0,0)
            );
        },
        style_vals: cumulate_style_deltas([
            // 'AG', 'GD', 'DE', 'EB', 'AB',  'LZ', 'ZH', 'HQ', 'QK',
            '', '', '', '', '',  '', '', '', '',
            // 'ticksAD', 'ticksDB', 'ticksLH', 'ticksHK',
            '', '', '', '',
            // 'A', 'B', 'G', 'D', 'E', 'Z', 'H', 'Q', 'K', 'L',
            'Α;s','Β;s','Γ;s','Δ;s','Ε;s','Ζ;s','Η;s','Θ;s','Κ;s','Λ;s'
        ],[
        [   {}, {}, {}, {}, {visible: false},  {}, {}, {}, {}, 
            {visible: false}, {visible: false}, {visible: false}, {visible: false}, 
            {}, {}, {}, {}, {},  {}, {}, {}, {}, {}, 
        ],[ {}, emph("red"), emph("blue"), {}, {},  {}, emph("red"), emph("blue"), {}, 
            {visible: false}, {visible: false}, {visible: false}, {visible: false}, 
            {}, {}, {}, {}, {},  {}, {}, {}, {}, {}, 
        ],[ emph("red"), emph("red"), emph("blue"), emph("blue"),  {}, {}, deemph(), deemph(), {}, 
            {visible: true}, {visible: true}, {visible: true}, {visible: true}, 
            {}, {}, {}, {}, {},  {}, {}, {}, {}, {}, 
        ],[ deemph(), deemph(), deemph(), deemph(),  {}, {}, {}, {}, {},
            emph("red"), emph("blue"), emph("red"), emph("blue"), 
            {}, {}, emph("red"), {}, emph("blue"),  emph("red"), {}, emph("blue"), {}, {}, 
        ],[ emph("red"), emph("red"), emph("blue"), emph("blue"), {},  emph("red"), emph("red"), emph("blue"), emph("blue"), 
            deemph(), deemph(), deemph(), deemph(), 
            {}, {}, deemph(), {}, deemph(),  deemph(), {}, deemph(), {}, {}, 
        ],[ emph("blue"), emph("blue"), emph("red"), emph("red"), {},  emph("blue"), emph("blue"), emph("red"), emph("red"), 
            {}, {}, {}, {}, 
            {}, {}, {}, {}, {},  {}, {}, {}, {}, {}, 
        ]]),
        paragraph_to_step: [0, 1, 2, 4, 5]
    }
]

export {configs}