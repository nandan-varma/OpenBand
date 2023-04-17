import Link from 'next/link';

function Index() {
  return (
    <div>
      <Link href="/piano" className="fancy-button pop-onhover bg-gradient1">
        <span>Try Piano</span>
      </Link>
    </div>
  );
}

export default Index;
