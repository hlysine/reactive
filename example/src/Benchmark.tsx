/* eslint-disable jsx-a11y/anchor-is-valid */
import { makeReactive, reactive } from '@hlysine/reactive';
import { memo } from 'react';

const random = (max: number) => Math.round(Math.random() * 1000) % max;

const A = [
  'pretty',
  'large',
  'big',
  'small',
  'tall',
  'short',
  'long',
  'handsome',
  'plain',
  'quaint',
  'clean',
  'elegant',
  'easy',
  'angry',
  'crazy',
  'helpful',
  'mushy',
  'odd',
  'unsightly',
  'adorable',
  'important',
  'inexpensive',
  'cheap',
  'expensive',
  'fancy',
];
const C = [
  'red',
  'yellow',
  'blue',
  'green',
  'pink',
  'brown',
  'purple',
  'brown',
  'white',
  'black',
  'orange',
];
const N = [
  'table',
  'chair',
  'house',
  'bbq',
  'desk',
  'car',
  'pony',
  'cookie',
  'sandwich',
  'burger',
  'pizza',
  'mouse',
  'keyboard',
];

let nextId = 1;

const buildData = (count: number) => {
  const data = new Array(count);

  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }

  return data;
};

interface Item {
  id: number;
  label: string;
}

const state = reactive({ data: [] as Item[], selected: 0 });

const run = () => {
  state.data = buildData(1000);
  state.selected = 0;
};

const runLots = () => {
  state.data = buildData(10000);
  state.selected = 0;
};

const add = () => {
  state.data.push(...buildData(1000));
};

const update = () => {
  const { data } = state;
  for (let i = 0; i < data.length; i += 10) {
    data[i].label += ' !!!';
  }
};

const clear = () => {
  state.data = [];
  state.selected = 0;
};

const swapRows = () => {
  const { data } = state;
  if (data.length > 998) {
    const tmp = data[998];
    data[998] = data[1];
    data[1] = tmp;
  }
};

const remove = (id: number) => {
  const { data } = state;
  const idx = data.findIndex((d) => d.id === id);
  data.splice(idx, 1);
};

const select = (id: number) => {
  state.selected = id;
};

const Row = memo(
  makeReactive(({ selected, item }: { selected: boolean; item: Item }) => (
    <tr className={selected ? 'danger' : ''}>
      <td className="col-md-1">{item.id}</td>
      <td className="col-md-4">
        <a onClick={() => select(item.id)}>{item.label}</a>
      </td>
      <td className="col-md-1">
        <a onClick={() => remove(item.id)}>
          <span className="glyphicon glyphicon-remove" aria-hidden="true" />
        </a>
      </td>
      <td className="col-md-6" />
    </tr>
  ))
);

const Button = ({
  id,
  cb,
  title,
}: {
  id: string;
  cb: () => void;
  title: string;
}) => (
  <div className="col-sm-6 smallpad">
    <button
      type="button"
      className="btn btn-primary btn-block"
      id={id}
      onClick={cb}
    >
      {title}
    </button>
  </div>
);

const Jumbotron = memo(
  () => (
    <div className="jumbotron">
      <div className="row">
        <div className="col-md-6">
          <h1>React Hooks keyed</h1>
        </div>
        <div className="col-md-6">
          <div className="row">
            <Button id="run" title="Create 1,000 rows" cb={run} />
            <Button id="runlots" title="Create 10,000 rows" cb={runLots} />
            <Button id="add" title="Append 1,000 rows" cb={add} />
            <Button id="update" title="Update every 10th row" cb={update} />
            <Button id="clear" title="Clear" cb={clear} />
            <Button id="swaprows" title="Swap Rows" cb={swapRows} />
          </div>
        </div>
      </div>
    </div>
  ),
  () => true
);

export default makeReactive(function Main() {
  const { data, selected } = state;
  return (
    <div className="container">
      <Jumbotron />
      <table className="table table-hover table-striped test-data">
        <tbody>
          {data.map((item) => (
            <Row key={item.id} item={item} selected={selected === item.id} />
          ))}
        </tbody>
      </table>
      <span
        className="preloadicon glyphicon glyphicon-remove"
        aria-hidden="true"
      />
    </div>
  );
});
