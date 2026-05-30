import {
    collection,
    getDocs,
    query,
    where,
} from 'firebase/firestore'

import { db } from '@/firebase/config'
export async function getFolderAudienceByUserId(
    userId
) {
    const snapshot =
        await getDocs(
            query(
                collection(
                    db,
                    'folders_audience'
                ),
                where(
                    'userId',
                    '==',
                    userId
                ),
                where(
                    'isDeleted',
                    '==',
                    false
                )
            )
        )

    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data(),
        })
    )
}