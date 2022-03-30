import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
// import PrismicDOM, { RichText, HTMLSerializer } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';
// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const postFormat: Post[] = postsPagination.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM y',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const [existsNextPage, setExistsNextPage] = useState(
    postsPagination.next_page != null && postsPagination.next_page
  );
  const [posts, setPosts] = useState(postFormat);

  function loadingMorePosts() {
    if (existsNextPage) {
      fetch(existsNextPage)
        .then(response => response.json())
        .then(postData => {
          const newPosts = postData.results.map(post => ({
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM y',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          }));

          setPosts([...posts, ...newPosts]);

          if (postData.next_page === null) {
            setExistsNextPage(null);
          } else {
            setExistsNextPage(postData.next_page);
          }
        });
    }
  }

  return (
    <div className={styles.container}>
      {posts.map(post => (
        <div key={post.uid} className={styles.containerPost}>
          <Link href={`post/${post.uid}`}>
            <h2>{post.data.title}</h2>
          </Link>
          <p>{post.data.subtitle}</p>
          <div className={styles.infoPost}>
            <FiCalendar color="#BBBBBB" className={styles.iconInfo} />
            <p>{post.first_publication_date}</p>
            <FiUser color="#BBBBBB" className={styles.iconInfo} />
            <p>{post.data.author}</p>
          </div>
        </div>
      ))}
      {existsNextPage && (
        <button type="button" onClick={loadingMorePosts}>
          Carregar mais posts
        </button>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
  };
};
