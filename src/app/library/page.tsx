// import Head from 'next'
import TopBar from '../../components/TopBar'
import SubBar from '../../components/SubBar'
import ToBook from '../../components/ToBook'
import AuthorName from '../../components/AuthorName'

export default function Home() {
  return (
    <div>
      <TopBar title={"Mathematica Classica per Linguas Figurasque"}/>
      <SubBar message={"A library for classics in mathematics."}/>
      <AuthorName name={"Euclid"} children={[
        <ToBook book_id="elements" key="elements" book_name="Elements" complete={false} />
      ]}/>
      <AuthorName name={"Archimedes"} children={[
        <ToBook book_id="on-spirals" key="on-spirals" book_name="On Spirals" complete={true} />,
        <ToBook book_id="on-the-sphere-and-the-cylinder" key="on-the-sphere-and-the-cylinder" book_name="On the Sphere and the Cylinder" complete={false} />
      ]}/>
      <AuthorName name={"Heron"} children={[
        <ToBook book_id="metrica" key="metrica" book_name="Metrica" complete={false} />
      ]}/>
    </div>
  );
}
