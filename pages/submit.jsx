import Head from 'next/head'
import dynamic from 'next/dynamic'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Restricted from '../components/Restricted'
import { useRouter } from 'next/router'
import { useState, useEffect } from "react"
import { stateToHTML } from 'draft-js-export-html';
import Draft, { EditorState, ContentState, Modifier } from 'draft-js'
import { WithContext as ReactTags } from 'react-tag-input';
import { getSession } from 'next-auth/react'



const Editor = dynamic(
  () => {return import('react-draft-wysiwyg').then(mod => mod.Editor)},
  { ssr: false }
)
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const HomePage = (props) => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [tags, setTags] = useState([]);
  const [editorState, setEditorState] = useState(()=> EditorState.createEmpty());
  const [htmlData, setHtmlData] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("7cpoems-submit-editor-data")) localStorage.setItem("7cpoems-submit-editor-data", "")
    if (!localStorage.getItem("7cpoems-submit-tags")) localStorage.setItem("7cpoems-submit-tags", "[]")
    if (!localStorage.getItem("7cpoems-submit-title")) localStorage.setItem("7cpoems-submit-title", "")
    const blocksFromHTML = Draft.convertFromHTML(localStorage.getItem("7cpoems-submit-editor-data"));
    const blocks = ContentState.createFromBlockArray(
      blocksFromHTML.contentBlocks,
      blocksFromHTML.entityMap,
    );

    setEditorState(() => EditorState.createWithContent(blocks))
    setHtmlData(localStorage.getItem("7cpoems-submit-editor-data"));
    setInput(localStorage.getItem("7cpoems-submit-title"));
    setTags(JSON.parse(localStorage.getItem("7cpoems-submit-tags")) == null ? [] : JSON.parse(localStorage.getItem("7cpoems-submit-tags")));
  }, []);
  
  function poem() {
    router.push("/submit")
  }
  
  function onChange(k) {
    setEditorState(k);
    var data = stateToHTML(k.getCurrentContent());
    setHtmlData(data);
    localStorage.setItem("7cpoems-submit-editor-data", data);
  }

  function onChangeTitle(e) {
    setInput(e.target.value);
    localStorage.setItem("7cpoems-submit-title", e.target.value);
  }
  function saveTags(val) {
    localStorage.setItem("7cpoems-submit-tags", JSON.stringify(val));
  }
  const handleDelete = i => {
    const newVal = tags.filter((tag, index) => index !== i);
    setTags(newVal);
    saveTags(newVal);
  };

  const handleAddition = tag => {
    tag.id = tag.id.toLocaleLowerCase();
    tag.text = tag.text.toLocaleLowerCase();
    const newVal = [...tags, tag];
    if (newVal.length < 15 && tag.text.length < 21) {
      setTags(newVal);
      saveTags(newVal);
    }
  };
	const handlePastedText = (text, html, editorState) => {
		if (html) {
			const blocksFromHTML = Draft.convertFromHTML(html.replace(/<b/g,'<p').replace(/<\/b/,'</p'));
			let contentState = Modifier.replaceWithFragment(
			  editorState.getCurrentContent(),
			  editorState.getSelection(),
			  ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap).getBlockMap()
			)
			
			onChange(EditorState.push(editorState, contentState, 'insert-fragment'))
			return true;
		} else {
			return false;
		}
  };
  const handleDrag = (tag, currPos, newPos) => {
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);
    
    // re-render
    setTags(newTags);
    saveTags(newTags);
  };

  const handleTagClick = index => {
    console.log('The tag at index ' + index + ' was clicked');
  };

  function submit() {
    fetch("/api/addpoem", {
      method: "POST",
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: htmlData,
        title: input,
        email: props.session.user.email,
        tags: tags
      })
    }).then(result => result.json()).then(json => {
      if (json.error) {
        setError(json.error.join("<br />"));
      } else {
        setError(null);
        router.push("/users/" + props.session.pk);
      }
      console.log(json);
    }).catch(err => {
      setError(err);
    })
  }
  
  if (props.session) {
    return (
      <div>
        <Head>
          <title>7C Poems</title>
  
        </Head>
        <Navbar />
        <div className="hero min-h-screen bg-base-200">
          <div className="hero-content">
            <div style={{
              maxWidth: "calc(100vw - 2rem)",
              width: "calc(80vw - 2rem)"
            }}>
              <h1 className="text-5xl font-bold mb-5">Submit your poem</h1>
              <input type="text" value={input} onInput={onChangeTitle} maxLength={100} placeholder="Type in the title of your poem" className="input input-lg input-bordered w-full  mb-3"  />
              <div>
								{/* @ts-ignore */} 
                <Editor editorState={editorState} handlePastedText={handlePastedText} onEditorStateChange={onChange} toolbar={{
					        options: ['inline', 'blockType', 'list', 'link', 'embedded', 'emoji', 'image', 'remove', 'history'],
					        inline: {
					          options: ['bold', 'italic', 'underline', 'strikethrough'],
					        }
                }}/>
              </div>
              <br />
              <ReactTags
                tags={tags}
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                handleDrag={handleDrag}
                handleTagClick={handleTagClick}
                inputFieldPosition="bottom"
                placeholder="Add up to 15 tags maximum"
                maxLength={20}
              />
              <br />
              <h2 className="text-3xl">Preview (note that all links will open in another tab when posted)</h2>
              <br />
              <div className="border mockup-window bg-base-300">
                <div className="output p-4 bg-base-200" style={{
                  maxWidth: "none !important",
                  overflowWrap: "break-word"
                }}>
                  <h1>{input}</h1>
                  <h2 className="mb-2">By {props.session.user.name}</h2>
                  <h4 className="mb-2">Published on {new Date().toLocaleString()}</h4>
                  <div className="mb-2">
                  {tags.map(val => {
                    console.log(val);
                    return (
                      <div className="badge badge-primary mr-3" key={val.id}>{val.text}</div>
                    );
                  })}
                  </div>
                  <div dangerouslySetInnerHTML={{__html: htmlData}}>
                  </div>
                </div>
              </div>
              <div className="preview prose">
                
              </div>
              
              <br />
              <button className="btn btn-primary" onClick={submit}>Submit</button>
              { error !== null ? (
              <div className="alert alert-error shadow-lg mt-3">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Error! <span dangerouslySetInnerHTML={{__html: error}}></span></span>
                </div>
              </div>) : null
              }
            </div>
          </div>
        </div>
        <Footer />
  
      </div>
    );
  } else {
    return (
      <div>
        <Navbar session={props.session} />
        <Restricted />
        <Footer />
      </div>
    );
  }
  
}

export default HomePage;


export async function getServerSideProps(context) {
  return {
    props: {
      session: await getSession(context)
    }
  }
}