import { SetStateAction, Dispatch } from 'react'
import {IdName, arange} from '../../utils/utils'

type Props = {
    layer_types: IdName[],
    initial_idxs: number[]
    idxs_setter: Dispatch<SetStateAction<number[]>>
}

export default (props: Props) => (
    <div style={{
        display: "flex"
    }}>{props.initial_idxs.map((_, col) =>
        <div key={`radio-${col}`} style={{
            flexBasis: "99%"
        }}> {props.layer_types.map((layer_type, idx) => 
        <span key={`radio-${col}-${layer_type.id}-span`}>
            <input key={`radio-${col}-${layer_type.id}-input`} type="radio" checked={props.initial_idxs[col] === idx} 
            id={`layer-type-${col}-${layer_type.id}`} name={`layer-type-${col}`} value={layer_type.id} 
            onChange={(event) => {let new_idxs = props.initial_idxs.slice(); new_idxs[col] = idx; props.idxs_setter(new_idxs);}} />
            <label key={`radio-${col}-${layer_type.id}-label`} 
            htmlFor={`layer-type-${col}-${layer_type.id}`}>{layer_type.name}</label>
        </span>
        )}
        </div>
    )}
    </div>
)