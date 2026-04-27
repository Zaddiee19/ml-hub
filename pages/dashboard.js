import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [articles, setArticles] = useState([])
  const [comments, setComments] = useState({})
  const [newTitle, setNewTitle] = useState('')
  const [newPost, setNewPost] = useState('')
  const [commentInputs, setCommentInputs] = useState({})
  const [replyInputs, setReplyInputs] = useState({})
  const router = useRouter()

  const smallBtn = {
    padding: '6px 12px',
    fontSize: '12px',
    marginRight: '5px',
    cursor: 'pointer',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px'
  }

  // ✅ LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ✅ SHARE FUNCTION (NEW)
  const shareArticle = (id) => {
    const link = `${window.location.origin}/article/${id}`

    if (navigator.share) {
      navigator.share({
        title: 'Check out this article',
        url: link
      })
    } else {
      navigator.clipboard.writeText(link)
      alert('Link copied to clipboard!')
    }
  }

  // ✅ CHECK USER
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.push('/login')
      } else {
        setUser(data.session.user)
      }
    }

    checkUser()
    fetchArticles()
  }, [])

  // ✅ FETCH ARTICLES (SORT BY LIKES)
  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })

    if (error) {
      console.log(error)
      return
    }

    setArticles(data || [])
    fetchComments(data || [])
  }

  // ✅ FETCH COMMENTS + REPLIES
  const fetchComments = async (articles) => {
    const { data } = await supabase.from('comments').select('*')

    const grouped = {}

    articles.forEach(article => {
      const all = (data || []).filter(c => c.article_id === article.id)

      grouped[article.id] = {
        parents: all.filter(c => !c.parent_id),
        replies: all.filter(c => c.parent_id)
      }
    })

    setComments(grouped)
  }

  // ✅ PUBLISH ARTICLE
  const publishArticle = async () => {
    if (!newTitle || !newPost) return

    await supabase.from('articles').insert([
      {
        title: newTitle,
        content: newPost,
        user_id: user.id,
        likes: 0
      }
    ])

    setNewTitle('')
    setNewPost('')
    fetchArticles()
  }

  // ✅ LIKE ARTICLE
  const likeArticle = async (id, likes) => {
    await supabase
      .from('articles')
      .update({ likes: likes + 1 })
      .eq('id', id)

    setArticles(prev =>
      [...prev]
        .map(a => a.id === id ? { ...a, likes: likes + 1 } : a)
        .sort((a, b) => b.likes - a.likes)
    )
  }

  // ✅ ADD COMMENT
  const addComment = async (articleId) => {
    const text = commentInputs[articleId]
    if (!text) return

    await supabase.from('comments').insert([
      {
        article_id: articleId,
        text,
        user_id: user.id,
        parent_id: null
      }
    ])

    setCommentInputs({ ...commentInputs, [articleId]: '' })
    fetchArticles()
  }

  // ✅ ADD REPLY
  const addReply = async (articleId, parentId) => {
    const text = replyInputs[parentId]
    if (!text) return

    await supabase.from('comments').insert([
      {
        article_id: articleId,
        text,
        user_id: user.id,
        parent_id: parentId
      }
    ])

    setReplyInputs({ ...replyInputs, [parentId]: '' })
    fetchArticles()
  }

  const handleReplyChange = (id, value) => {
    setReplyInputs({ ...replyInputs, [id]: value })
  }

  return (
    <div style={{ minHeight: '100vh', color: '#e5e7eb' }}>

      {/* HEADER */}
      <div style={{
        padding: '15px 30px',
        background: 'linear-gradient(135deg, #1f1c2c, #928dab)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ color: 'white' }}>ML Hub Dashboard</h2>

        {user && (
          <div>
            <span style={{ marginRight: '15px', color: 'white' }}>
              {user.email}
            </span>

            <button style={smallBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: '900px', margin: '20px auto' }}>

        {/* POST BOX */}
        <div style={{
          background: '#111827',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>

          <input
            placeholder="Article title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              background: '#0b1220',
              color: 'white'
            }}
          />

          <textarea
            placeholder="Write your article..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '10px',
              background: '#0b1220',
              color: 'white'
            }}
          />

          <button style={smallBtn} onClick={publishArticle}>
            Publish
          </button>
        </div>

        {/* ARTICLES */}
        {articles.map(article => (
          <div key={article.id} style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
            padding: '15px',
            borderRadius: '12px',
            marginBottom: '15px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>

            <h3>{article.title}</h3>
            <p>{article.content}</p>

            {/* ACTIONS */}
            <button style={smallBtn} onClick={() => likeArticle(article.id, article.likes)}>
              👍 {article.likes}
            </button>

            <button style={smallBtn} onClick={() => shareArticle(article.id)}>
              🔗 Share
            </button>

            {/* COMMENTS */}
            <div style={{ marginTop: '15px' }}>
              <strong>Comments</strong>

              {(comments[article.id]?.parents || []).map(comment => (
                <div key={comment.id} style={{ marginTop: '10px' }}>

                  <p>• {comment.text}</p>

                  <div style={{ marginLeft: '20px' }}>
                    {(comments[article.id]?.replies || [])
                      .filter(r => r.parent_id === comment.id)
                      .map(reply => (
                        <p key={reply.id} style={{ color: '#cbd5e1' }}>
                          ↳ {reply.text}
                        </p>
                      ))}
                  </div>

                  <div style={{ marginLeft: '20px' }}>
                    <input
                      placeholder="Reply..."
                      value={replyInputs[comment.id] || ''}
                      onChange={(e) =>
                        handleReplyChange(comment.id, e.target.value)
                      }
                      style={{
                        width: '60%',
                        padding: '5px',
                        marginTop: '5px',
                        background: '#0b1220',
                        color: 'white'
                      }}
                    />

                    <button style={smallBtn} onClick={() => addReply(article.id, comment.id)}>
                      Reply
                    </button>
                  </div>

                </div>
              ))}

              <div style={{ marginTop: '10px' }}>
                <input
                  placeholder="Write a comment..."
                  value={commentInputs[article.id] || ''}
                  onChange={(e) =>
                    setCommentInputs({
                      ...commentInputs,
                      [article.id]: e.target.value
                    })
                  }
                  style={{
                    width: '70%',
                    padding: '6px',
                    background: '#0b1220',
                    color: 'white'
                  }}
                />

                <button style={smallBtn} onClick={() => addComment(article.id)}>
                  Comment
                </button>
              </div>

            </div>

          </div>
        ))}

      </div>
    </div>
  )
}