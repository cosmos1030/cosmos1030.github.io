# Content Management Guide

이제 웹사이트의 모든 콘텐츠가 별도의 파일로 분리되어 쉽게 편집할 수 있습니다.

## 📁 파일 구조

```
data/
├── personal.js        # 개인정보, 소개, 교육, 스킬
├── research.js        # 연구 경험
├── publications.js    # 논문 및 발표
├── projects.js        # 프로젝트
└── content-manager.js # 동적 로딩 시스템 (건드리지 마세요)
```

## ✏️ 콘텐츠 수정 방법

### 1. 개인정보 수정 (`data/personal.js`)

```javascript
const sitePersonalInfo = {
    name: "Doyoon Kim",
    title: "AI Researcher & Computer Science Student", 
    description: "여기에 간단한 소개를...",
    
    contact: {
        email: "이메일주소",
        linkedin: "링크드인 URL",
        github: "깃허브 URL"
    },
    
    about: [
        "첫 번째 문단...",
        "두 번째 문단..."
    ],
    
    education: [
        {
            institution: "학교명",
            degree: "학위",
            gpa: "성적",
            period: "기간"
        }
    ],
    
    skills: {
        "카테고리1": ["스킬1", "스킬2"],
        "카테고리2": ["스킬3", "스킬4"]
    }
};
```

### 2. 연구 경험 추가/수정 (`data/research.js`)

```javascript
const siteResearchExperience = [
    {
        period: "기간",
        institution: "연구기관명",
        advisor: {
            name: "지도교수명",
            url: "교수 홈페이지 URL"
        },
        description: "연구 설명...",
        projects: [  // 프로젝트가 여러개인 경우
            "프로젝트1 설명...",
            "프로젝트2 설명..."
        ]
    }
];
```

### 3. 논문 추가/수정 (`data/publications.js`)

```javascript
const sitePublications = [
    {
        status: "학회명 또는 상태",
        title: "논문 제목",
        authors: "저자명 (본인은 D. Kim으로)",
        links: [
            { type: "Paper", url: "논문 URL" },
            { type: "Code", url: "코드 URL" }
        ],
        type: "published" // 또는 "in-prep"
    }
];
```

### 4. 프로젝트 추가/수정 (`data/projects.js`)

```javascript
const siteProjects = [
    {
        title: "프로젝트 제목",
        period: "진행 기간",
        description: "프로젝트 설명...",
        links: [
            { type: "Demo", url: "데모 URL" },
            { type: "Code", url: "코드 URL" }
        ]
    }
];
```

## 🚀 수정 후 확인하기

1. 파일 저장
2. 웹브라우저에서 새로고침
3. 변경사항 확인

## 💡 팁

- **굵은 글씨**: `<strong>텍스트</strong>` 사용
- **기울임 글씨**: `<em>텍스트</em>` 사용
- **링크**: HTML `<a>` 태그 사용 가능
- **줄바꿈**: 배열의 새 요소로 분리

## ⚠️ 주의사항

- JavaScript 문법을 지켜주세요 (따옴표, 쉼표, 중괄호 등)
- `content-manager.js`는 수정하지 마세요
- 변경 후 문법 오류가 있으면 브라우저 콘솔에서 확인 가능합니다