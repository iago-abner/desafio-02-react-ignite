import { GetStaticPaths, GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import PrismicDOM, { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const fallback = useRouter();

  if (fallback.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const content = post.data.content.map(insideContent => ({
    heading: insideContent.heading,
    body: PrismicDOM.RichText.asHtml(insideContent.body),
  }));

  // console.log('post: ', JSON.stringify(post, null, 2));

  const formatPost = {
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM y',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: post.data.title,
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content,
    },
  };

  const countReadingTime = post.data.content.reduce(
    (total, amount, index, array) => {
      const amountWordsHeading = amount.heading.split(' ').length;

      const amountWordsBody = amount.body
        .map(contentBody => contentBody.text.split(' ').length)
        .reduce((totalSum, value) => totalSum + value, 0);

      total += amountWordsHeading + amountWordsBody;

      if (index === array.length - 1) {
        return Math.ceil(total / 200);
      }

      return total;
    },
    0
  );

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <img src={formatPost.data.banner.url} alt="Banner" />
      </div>
      <div className={styles.content}>
        <h1>{formatPost.data.title}</h1>

        <div className={styles.infoPost}>
          <div className={styles.dataInfo}>
            <FiCalendar color="#BBBBBB" className={styles.iconInfoPost} />
            <p>{formatPost.first_publication_date}</p>
          </div>
          <div className={styles.dataInfo}>
            <FiUser color="#BBBBBB" className={styles.iconInfoPost} />
            <p>{formatPost.data.author}</p>
          </div>
          <div className={styles.dataInfo}>
            <FiClock color="#BBBBBB" className={styles.iconInfoPost} />
            <p>{countReadingTime} min</p>
          </div>
        </div>

        <div className={styles.postContent}>
          {formatPost.data.content.map(content => (
            <div key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: content.body,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const post: Post = await prismic.getByUID('post', String(slug), {});

  return {
    props: {
      post,
    },
    redirect: 60 * 30,
  };
};
